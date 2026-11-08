import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { ThrottlerModule } from 'src/engine/core-modules/throttler/throttler.module';
import { PulseFormsController } from './pulse-forms.controller';
import { PulseFormsResolver } from './pulse-forms.resolver';
import { PulseFormsService } from './services/pulse-forms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KeyValuePairEntity,
      UserEntity,
      UserWorkspaceEntity,
    ]),
    WorkspaceCacheModule,
    ThrottlerModule,
  ],
  controllers: [PulseFormsController],
  providers: [PulseFormsResolver, PulseFormsService],
})
export class PulseFormsModule {}
