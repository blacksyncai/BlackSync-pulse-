import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Like, Repository } from 'typeorm';

import {
  KeyValuePairEntity,
  KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { type PulseEnrollment } from 'src/engine/core-modules/pulse-outreach/types/pulse-outreach.type';

const KEY_PREFIX = 'pulse-outreach:enrollment:';

// One row per enrollment, so the scheduler and people enrolling leads never
// overwrite each other's changes.
@Injectable()
export class PulseEnrollmentStoreService {
  constructor(
    @InjectRepository(KeyValuePairEntity)
    private readonly keyValuePairRepository: Repository<KeyValuePairEntity>,
    private readonly keyValuePairService: KeyValuePairService,
  ) {}

  async list(workspaceId: string): Promise<PulseEnrollment[]> {
    const rows = await this.keyValuePairRepository.find({
      where: {
        workspaceId,
        userId: IsNull(),
        type: KeyValuePairType.USER_VARIABLE,
        key: Like(`${KEY_PREFIX}%`),
      },
    });

    return rows.map((row) => row.value as unknown as PulseEnrollment);
  }

  async save(workspaceId: string, enrollment: PulseEnrollment): Promise<void> {
    await this.keyValuePairService.set({
      workspaceId,
      userId: null,
      type: KeyValuePairType.USER_VARIABLE,
      key: `${KEY_PREFIX}${enrollment.id}`,
      value: enrollment,
    });
  }
}
