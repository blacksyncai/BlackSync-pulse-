import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { type PulseSettingKey } from 'src/engine/core-modules/pulse-crm/constants/pulse-setting-keys.constant';

const storageKey = (key: PulseSettingKey) => `pulse-setting:${key}`;

@Injectable()
export class PulseSettingsService {
  constructor(private readonly keyValuePairService: KeyValuePairService) {}

  async get<TValue>(
    workspaceId: string,
    key: PulseSettingKey,
  ): Promise<TValue | null> {
    const [stored] = await this.keyValuePairService.get({
      workspaceId,
      userId: null,
      type: KeyValuePairType.USER_VARIABLE,
      key: storageKey(key),
    });

    return (stored?.value as TValue | undefined) ?? null;
  }

  async set(
    workspaceId: string,
    key: PulseSettingKey,
    value: unknown,
  ): Promise<void> {
    await this.keyValuePairService.set({
      workspaceId,
      userId: null,
      type: KeyValuePairType.USER_VARIABLE,
      key: storageKey(key),
      value,
    });
  }
}
