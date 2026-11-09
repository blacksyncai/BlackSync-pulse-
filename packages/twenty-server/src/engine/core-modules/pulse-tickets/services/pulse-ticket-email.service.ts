import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, ILike, IsNull, Like, MoreThan, Repository } from 'typeorm';
import { v5 } from 'uuid';
import { MessageParticipantRole } from 'twenty-shared/types';
import {
  KeyValuePairEntity,
  KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { fromUserEntityToFlat } from 'src/engine/core-modules/user/utils/from-user-entity-to-flat.util';
import { buildUserAuthContext } from 'src/engine/core-modules/auth/utils/build-user-auth-context.util';
import { type FlatWorkspace } from 'src/engine/core-modules/workspace/types/flat-workspace.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { type MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';
import { type MessageWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message.workspace-entity';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import {
  matchesTicketEmail,
  parseTicketEmailRule,
  type TicketEmailRule,
} from '../utils/ticket-email-rule';

const PREFIX = 'pulse-ticket-email:v1:';
export type TicketActor = {
  workspaceId: string;
  userId: string;
  userWorkspaceId: string;
};

@Injectable()
export class PulseTicketEmailService {
  private readonly logger = new Logger(PulseTicketEmailService.name);
  constructor(
    @InjectRepository(KeyValuePairEntity)
    private readonly storage: Repository<KeyValuePairEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly memberships: Repository<UserWorkspaceEntity>,
    @InjectRepository(MessageChannelEntity)
    private readonly channels: Repository<MessageChannelEntity>,
    private readonly workspaceCache: WorkspaceCacheService,
    private readonly orm: WorkspaceOrmManager,
  ) {}

  async settings(actor: TicketActor) {
    const channels = await this.channels.find({
      where: {
        workspaceId: actor.workspaceId,
        connectedAccount: {
          userWorkspaceId: actor.userWorkspaceId,
          archivedAt: IsNull(),
        },
      },
      relations: { connectedAccount: true },
    });
    const rules = await this.storage.find({
      where: {
        workspaceId: actor.workspaceId,
        userId: actor.userId,
        key: Like(`${PREFIX}%`),
        deletedAt: IsNull(),
      },
    });
    return {
      mailboxes: channels.map(({ id, handle, isSyncEnabled }) => ({
        id,
        handle,
        isSyncEnabled,
      })),
      rules: rules.map(({ value }) => value),
    };
  }

  private async ownedChannel(actor: TicketActor, channelId: string) {
    const channel = await this.channels.findOne({
      where: {
        id: channelId,
        workspaceId: actor.workspaceId,
        connectedAccount: {
          userWorkspaceId: actor.userWorkspaceId,
          archivedAt: IsNull(),
        },
      },
      relations: { connectedAccount: true },
    });
    if (!channel)
      throw new ForbiddenException(
        'Choose a mailbox connected to your own account.',
      );
    return channel;
  }

  async save(actor: TicketActor, input: unknown) {
    const rule = parseTicketEmailRule(input);
    await this.ownedChannel(actor, rule.channelId);
    // Enabling or editing starts from now; old imported mail is never backfilled.
    const now = new Date().toISOString();
    const value: TicketEmailRule = {
      ...rule,
      userId: actor.userId,
      userWorkspaceId: actor.userWorkspaceId,
      enabledAt: now,
      cursorAt: now,
      cursorId: '00000000-0000-0000-0000-000000000000',
    };
    await this.storage.manager.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`pulse-ticket-rule:${actor.workspaceId}:${rule.channelId}`],
      );
      const repository = manager.getRepository(KeyValuePairEntity);
      const existing = await repository.findOne({
        where: {
          workspaceId: actor.workspaceId,
          userId: actor.userId,
          key: `${PREFIX}${rule.channelId}`,
          applicationId: IsNull(),
        },
      });
      await repository.save(
        repository.create({
          ...existing,
          workspaceId: actor.workspaceId,
          userId: actor.userId,
          key: `${PREFIX}${rule.channelId}`,
          applicationId: null,
          type: KeyValuePairType.USER_VARIABLE,
          value: value as unknown as JSON,
          deletedAt: null,
        }),
      );
    });
    return value;
  }

  async scanWorkspace(workspaceId: string) {
    const rules = await this.storage.find({
      where: { workspaceId, key: Like(`${PREFIX}%`), deletedAt: IsNull() },
    });
    for (const row of rules) {
      if (!(row.value as unknown as TicketEmailRule).enabled) continue;
      try {
        await this.scanRule(row);
      } catch {
        this.logger.warn(
          `Client ticket email capture paused for rule ${row.id}; check mailbox sync and member record permissions.`,
        );
      }
    }
  }

  private async scanRule(row: KeyValuePairEntity) {
    // The lock also makes disable/edit take effect before the next batch starts.
    await this.storage.manager.transaction(async (manager) => {
      const stored = row.value as unknown as TicketEmailRule;
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`pulse-ticket-rule:${row.workspaceId}:${stored.channelId}`],
      );
      const current = await manager
        .getRepository(KeyValuePairEntity)
        .findOneByOrFail({ id: row.id });
      const rule = current.value as unknown as TicketEmailRule;
      if (!rule.enabled || !row.workspaceId || row.userId !== rule.userId)
        return;
      const actor = {
        workspaceId: row.workspaceId,
        userId: rule.userId,
        userWorkspaceId: rule.userWorkspaceId,
      };
      const channel = await this.ownedChannel(actor, rule.channelId);
      if (!channel.isSyncEnabled || channel.connectedAccount.authFailedAt)
        return;
      const membership = await this.memberships.findOneBy({
        id: actor.userWorkspaceId,
        workspaceId: actor.workspaceId,
        userId: actor.userId,
      });
      const user = await this.users.findOneBy({ id: actor.userId });
      const { flatWorkspaceMemberMaps } =
        await this.workspaceCache.getOrRecompute(actor.workspaceId, [
          'flatWorkspaceMemberMaps',
        ]);
      const memberId = flatWorkspaceMemberMaps.idByUserId[actor.userId];
      const member = memberId
        ? flatWorkspaceMemberMaps.byId[memberId]
        : undefined;
      if (!membership || !user || !member || !memberId)
        throw new ForbiddenException();
      const context = buildUserAuthContext({
        workspace: { id: actor.workspaceId } as FlatWorkspace,
        userWorkspaceId: actor.userWorkspaceId,
        user: fromUserEntityToFlat(user),
        workspaceMemberId: memberId,
        workspaceMember: member,
      });
      await this.orm.executeInWorkspaceContext(async () => {
        await this.orm.runInWorkspaceTransaction(async (transaction) => {
          const associations =
            this.orm.getRepositoryWithContextPermissions<MessageChannelMessageAssociationWorkspaceEntity>(
              'messageChannelMessageAssociation',
              transaction,
            );
          const messages =
            this.orm.getRepositoryWithContextPermissions<MessageWorkspaceEntity>(
              'message',
              transaction,
            );
          const participants =
            this.orm.getRepositoryWithContextPermissions<MessageParticipantWorkspaceEntity>(
              'messageParticipant',
              transaction,
            );
          const people =
            this.orm.getRepositoryWithContextPermissions<PersonWorkspaceEntity>(
              'person',
              transaction,
            );
          const clients = this.orm.getRepositoryWithContextPermissions(
            'company',
            transaction,
          );
          const tickets = this.orm.getRepositoryWithContextPermissions(
            'clientTicket',
            transaction,
          );
          const base = {
            messageChannelId: rule.channelId,
            direction: MessageDirection.INCOMING,
          };
          const batch = await associations.find({
            where: [
              { ...base, createdAt: MoreThan(rule.cursorAt) },
              {
                ...base,
                createdAt: Equal(rule.cursorAt),
                id: MoreThan(rule.cursorId),
              },
            ],
            order: { createdAt: 'ASC', id: 'ASC' },
            take: 100,
          });
          for (const association of batch) {
            const message = await messages.findOneBy({
              id: association.messageId,
            });
            if (
              message &&
              !message.isDraft &&
              matchesTicketEmail(
                message.subject ?? '',
                message.receivedAt ? new Date(message.receivedAt) : null,
                rule,
              )
            ) {
              const senders = await participants.find({
                where: {
                  messageId: message.id,
                  role: MessageParticipantRole.FROM,
                },
                take: 10,
              });
              const clientIds = new Set<string>();
              for (const sender of senders) {
                const matches = sender.personId
                  ? [await people.findOneBy({ id: sender.personId })]
                  : sender.handle
                    ? await people.find({
                        where: {
                          emails: {
                            primaryEmail: ILike(
                              sender.handle.replace(
                                /[\\%_]/g,
                                (character) => `\\${character}`,
                              ),
                            ),
                          },
                        },
                        take: 2,
                      })
                    : [];
                if (matches.length !== 1) continue;
                const person = matches[0];
                if (
                  person?.companyId &&
                  (await clients.findOneBy({ id: person.companyId }))
                )
                  clientIds.add(person.companyId);
              }
              if (clientIds.size === 1 && message.messageThreadId) {
                const id = v5(
                  `${actor.workspaceId}:${rule.channelId}:${message.messageThreadId}`,
                  v5.URL,
                );
                await transaction.executeRawQuery(
                  'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
                  [`pulse-ticket:${id}`],
                );
                if (
                  !(await tickets.findOne({ where: { id }, withDeleted: true }))
                ) {
                  await tickets.insert({
                    id,
                    name: (message.subject || 'Client email request').slice(
                      0,
                      250,
                    ),
                    description:
                      'Created from a matching incoming email. Review the original conversation in Inbox before starting work. Email body is not copied.',
                    status: 'NEW',
                    priority: 'NORMAL',
                    source: 'EMAIL',
                    sourceMessageId: message.id,
                    sourceThreadId: message.messageThreadId,
                    clientId: [...clientIds][0],
                    assigneeId: memberId,
                    position: Date.now(),
                  });
                }
              }
            }
            rule.cursorAt = new Date(association.createdAt).toISOString();
            rule.cursorId = association.id;
          }
        });
      }, context);
      // Tickets commit first. If saving the cursor fails, deterministic IDs make replay safe.
      await manager
        .getRepository(KeyValuePairEntity)
        .update(row.id, { value: rule as unknown as JSON });
    });
  }
}
