import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainServerConfigModule } from 'src/engine/core-modules/domain/domain-server-config/domain-server-config.module';
import { KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { PulseWelcomeService } from 'src/engine/core-modules/pulse-welcome/services/pulse-welcome.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeyValuePairEntity, UserEntity]),
    DomainServerConfigModule,
  ],
  providers: [PulseWelcomeService],
  exports: [PulseWelcomeService],
})
export class PulseWelcomeModule {}
