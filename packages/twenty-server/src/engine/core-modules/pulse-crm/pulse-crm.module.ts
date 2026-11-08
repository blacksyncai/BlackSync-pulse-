import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { Module } from '@nestjs/common';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PulseCrmResolver } from 'src/engine/core-modules/pulse-crm/pulse-crm.resolver';
import { PulseLeadsService } from 'src/engine/core-modules/pulse-crm/services/pulse-leads.service';
import { PulseSettingsService } from 'src/engine/core-modules/pulse-crm/services/pulse-settings.service';

@Module({
  imports: [KeyValuePairModule, PermissionsModule],
  providers: [PulseCrmResolver, PulseLeadsService, PulseSettingsService],
  exports: [PulseSettingsService],
})
export class PulseCrmModule {}
