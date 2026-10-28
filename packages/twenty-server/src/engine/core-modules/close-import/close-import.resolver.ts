import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { CloseImportStatusDTO } from 'src/engine/core-modules/close-import/dtos/close-import-status.dto';
import { CloseApiError } from 'src/engine/core-modules/close-import/services/close-api.client';
import {
  CloseImportAlreadyRunningError,
  CloseImportService,
} from 'src/engine/core-modules/close-import/services/close-import.service';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import {
  ConflictError,
  UserInputError,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';

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
  SettingsPermissionGuard(PermissionFlagType.IMPORT_CSV),
)
@UseFilters(PreventNestToAutoLogGraphqlErrorsFilter)
@MetadataResolver()
export class CloseImportResolver {
  constructor(private readonly closeImportService: CloseImportService) {}

  @Query(() => CloseImportStatusDTO)
  async closeImportStatus(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<CloseImportStatusDTO> {
    return this.closeImportService.getStatus(workspace.id);
  }

  @Mutation(() => CloseImportStatusDTO)
  async startCloseImport(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('apiKey', { type: () => String }) apiKey: string,
  ): Promise<CloseImportStatusDTO> {
    try {
      return await this.closeImportService.start(workspace.id, apiKey);
    } catch (error) {
      if (error instanceof CloseImportAlreadyRunningError) {
        throw new ConflictError('A Close import is already running');
      }

      if (error instanceof CloseApiError) {
        throw new UserInputError(
          error.status === 401
            ? 'That Close API key did not work. Copy it again from Close settings.'
            : error.message,
        );
      }

      throw error;
    }
  }
}
