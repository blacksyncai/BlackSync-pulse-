import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { GraphQLJSON } from 'graphql-type-json';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  PULSE_SETTING_KEYS,
  type PulseSettingKey,
} from 'src/engine/core-modules/pulse-crm/constants/pulse-setting-keys.constant';
import { PulseLeadsService } from 'src/engine/core-modules/pulse-crm/services/pulse-leads.service';
import { PulseSettingsService } from 'src/engine/core-modules/pulse-crm/services/pulse-settings.service';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

const MAX_SETTING_BYTES = 512 * 1024;

const toSettingKey = (key: string): PulseSettingKey => {
  if (!(PULSE_SETTING_KEYS as readonly string[]).includes(key)) {
    throw new UserInputError(`Unknown Pulse setting "${key}"`);
  }

  return key as PulseSettingKey;
};

@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: false,
      playground: false,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
)
@UseFilters(PreventNestToAutoLogGraphqlErrorsFilter)
@MetadataResolver()
export class PulseCrmResolver {
  constructor(
    private readonly pulseLeadsService: PulseLeadsService,
    private readonly pulseSettingsService: PulseSettingsService,
  ) {}

  @Query(() => GraphQLJSON)
  async pulseLeads(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.pulseLeadsService.listLeads(workspace.id);
  }

  @Query(() => GraphQLJSON, { nullable: true })
  async pulseSetting(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('key', { type: () => String }) key: string,
  ) {
    return this.pulseSettingsService.get(workspace.id, toSettingKey(key));
  }

  @Mutation(() => Boolean)
  async setPulseSetting(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('key', { type: () => String }) key: string,
    @Args('value', { type: () => GraphQLJSON }) value: unknown,
  ) {
    if (JSON.stringify(value ?? null).length > MAX_SETTING_BYTES) {
      throw new UserInputError('That setting is too large to save');
    }

    await this.pulseSettingsService.set(workspace.id, toSettingKey(key), value);

    return true;
  }
}
