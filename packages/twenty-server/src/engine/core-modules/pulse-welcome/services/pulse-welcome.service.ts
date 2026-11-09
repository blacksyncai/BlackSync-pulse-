import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNonEmptyString } from '@sniptt/guards';
import { type EntityManager, Repository } from 'typeorm';
import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { EmailService } from 'src/engine/core-modules/email/email.service';
import { EmailDriver } from 'src/engine/core-modules/email/enums/email-driver.enum';
import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import {
  KeyValuePairEntity,
  KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { buildPulseWelcomeEmail } from 'src/engine/core-modules/pulse-welcome/utils/build-pulse-welcome-email.util';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';

export const PULSE_WELCOME_KEY = 'pulse-welcome-email:v1';

@Injectable()
export class PulseWelcomeService {
  private readonly logger = new Logger(PulseWelcomeService.name);
  constructor(
    @InjectRepository(KeyValuePairEntity)
    private readonly outbox: Repository<KeyValuePairEntity>,
    private readonly emailService: EmailService,
    private readonly config: TwentyConfigService,
    private readonly domains: DomainServerConfigService,
    private readonly translations: I18nService,
  ) {}

  // The marker commits with the account or membership, so rolled-back signups cannot send mail.
  async schedule(userId: string, manager: EntityManager): Promise<void> {
    await manager
      .getRepository(KeyValuePairEntity)
      .createQueryBuilder()
      .insert()
      .values({
        key: PULSE_WELCOME_KEY,
        userId,
        workspaceId: null,
        applicationId: null,
        type: KeyValuePairType.USER_VARIABLE,
        value: { status: 'pending' } as unknown as JSON,
      })
      .orIgnore()
      .execute();
  }

  async queueForUser(userId: string): Promise<void> {
    try {
      await this.dispatchPending(userId);
    } catch {
      this.logger.error(
        `Welcome email for user ${userId} remains pending for retry.`,
      );
    }
  }

  async dispatchPending(userId?: string): Promise<number> {
    if (
      this.config.get('EMAIL_DRIVER') !== EmailDriver.SMTP ||
      !isNonEmptyString(this.config.get('EMAIL_FROM_ADDRESS'))
    )
      return 0;
    const query = this.pendingQuery(this.outbox);
    if (userId) query.andWhere('welcome."userId" = :userId', { userId });
    const pending = await query
      .orderBy('welcome."createdAt"', 'ASC')
      .take(50)
      .getMany();
    let queued = 0;
    for (const candidate of pending) {
      const didQueue = await this.outbox.manager.transaction(
        async (manager) => {
          const repository = manager.getRepository(KeyValuePairEntity);
          const welcome = await this.pendingQuery(repository)
            .andWhere('welcome.id = :id', { id: candidate.id })
            .setLock('pessimistic_write')
            .setOnLocked('skip_locked')
            .getOne();
          if (!welcome) return false;
          const user = welcome.userId
            ? await manager
                .getRepository(UserEntity)
                .findOne({ where: { id: welcome.userId } })
            : null;
          if (!user || !isNonEmptyString(user.email)) {
            await repository.update(welcome.id, {
              value: { status: 'skipped' } as unknown as JSON,
            });
            return false;
          }
          const message = buildPulseWelcomeEmail({
            firstName: user.firstName ?? '',
            link: this.domains.getBaseUrl().toString(),
            i18n: this.translations.getI18nInstance(user.locale),
          });
          await this.emailService.send(
            {
              from: `${this.config.get('EMAIL_FROM_NAME')} <${this.config.get('EMAIL_FROM_ADDRESS')}>`,
              to: user.email,
              ...message,
            },
            {
              id: `pulse-welcome-${user.id}`,
              deduplication: { id: `pulse-welcome-${user.id}` },
            },
          );
          await repository.update(welcome.id, {
            value: {
              status: 'queued',
              queuedAt: new Date().toISOString(),
            } as unknown as JSON,
          });
          return true;
        },
      );
      if (didQueue) queued++;
    }
    return queued;
  }

  private pendingQuery(repository: Repository<KeyValuePairEntity>) {
    return repository
      .createQueryBuilder('welcome')
      .where('welcome.key = :key', { key: PULSE_WELCOME_KEY })
      .andWhere('welcome.type = :type', {
        type: KeyValuePairType.USER_VARIABLE,
      })
      .andWhere(
        'welcome."workspaceId" IS NULL AND welcome."applicationId" IS NULL',
      )
      .andWhere('welcome."userId" IS NOT NULL AND welcome."deletedAt" IS NULL')
      .andWhere("welcome.value->>'status' = :status", { status: 'pending' });
  }
}
