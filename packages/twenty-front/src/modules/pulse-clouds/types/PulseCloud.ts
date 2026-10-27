import { type MessageDescriptor } from '@lingui/core';
import { type IconComponent } from 'twenty-ui/icon';

export type PulseCloud = {
  universalIdentifier: string;
  label: MessageDescriptor;
  description: MessageDescriptor;
  highlights: MessageDescriptor[];
  Icon: IconComponent;
  tarballPath: string;
};
