import { type ReactNode } from 'react';
import { Card } from 'twenty-ui/primitives/surfaces';

type SettingsActionCardProps = { children: ReactNode };

export const SettingsActionCard = ({ children }: SettingsActionCardProps) => (
  <Card.Root rounded>{children}</Card.Root>
);
