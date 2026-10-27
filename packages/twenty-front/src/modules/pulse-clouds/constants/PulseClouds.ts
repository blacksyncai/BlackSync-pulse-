import { type PulseCloud } from '@/pulse-clouds/types/PulseCloud';
import { msg } from '@lingui/core/macro';
import { IconBriefcase, IconCoins, IconHome, IconShield } from 'twenty-ui/icon';

// Universal identifiers come from each app's application.config.ts in
// packages/twenty-apps/internal/pulse-*; the tarballs are built from those apps.
export const PULSE_CLOUDS: PulseCloud[] = [
  {
    universalIdentifier: '9cc0d3eb-83d5-50a7-87b5-75be4387d866',
    label: msg`Real Estate`,
    description: msg`For agents, teams and brokerages`,
    highlights: [msg`Listings`, msg`Listing pipeline`, msg`Buyer pipeline`],
    Icon: IconHome,
    tarballPath: '/clouds/pulse-real-estate.tgz',
  },
  {
    universalIdentifier: '8d970ea7-a496-5e99-9ff8-be2f303a8e87',
    label: msg`Insurance`,
    description: msg`For agencies and independent agents`,
    highlights: [msg`Policies`, msg`New business pipeline`, msg`Renewals`],
    Icon: IconShield,
    tarballPath: '/clouds/pulse-insurance.tgz',
  },
  {
    universalIdentifier: '6c82e693-ad95-5337-b9e1-2a153bce44ce',
    label: msg`Mortgage & Lending`,
    description: msg`For loan officers, brokers and lenders`,
    highlights: [msg`Loans`, msg`Borrowers`, msg`Lead-to-funded pipeline`],
    Icon: IconCoins,
    tarballPath: '/clouds/pulse-mortgage-lending.tgz',
  },
  {
    universalIdentifier: '4b1b0aa2-d39a-5e42-b8e0-896b38d716cd',
    label: msg`Corporate Sales`,
    description: msg`For B2B and enterprise sales teams`,
    highlights: [msg`Enterprise pipeline`, msg`Renewals`, msg`Forecast`],
    Icon: IconBriefcase,
    tarballPath: '/clouds/pulse-corporate-sales.tgz',
  },
];
