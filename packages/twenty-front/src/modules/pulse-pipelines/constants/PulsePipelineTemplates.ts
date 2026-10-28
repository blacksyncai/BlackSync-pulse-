export type PulsePipelineTemplate = {
  id: string;
  name: string;
  description: string;
  stages: string[];
};

export const PULSE_PIPELINE_TEMPLATES: PulsePipelineTemplate[] = [
  {
    id: 'smb',
    name: 'SMB Sales',
    description: 'Short cycle, high volume',
    stages: [
      'New lead',
      'Contacted',
      'Demo booked',
      'Proposal sent',
      'Closed won',
      'Closed lost',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Sales',
    description: 'Multi-stakeholder, long cycle',
    stages: [
      'Prospecting',
      'Discovery',
      'Solution fit',
      'Proposal',
      'Legal & procurement',
      'Closed won',
      'Closed lost',
    ],
  },
  {
    id: 'partnerships',
    name: 'Partnerships',
    description: 'Channel and referral partners',
    stages: [
      'Identified',
      'Intro call',
      'Agreement sent',
      'Onboarding',
      'Active partner',
    ],
  },
  {
    id: 'renewals',
    name: 'Renewals & Expansion',
    description: 'Keep and grow existing customers',
    stages: ['Upcoming', 'Check-in', 'Upsell offered', 'Renewed', 'Churned'],
  },
  {
    id: 'blank',
    name: '',
    description: 'Start from scratch',
    stages: ['New', 'In progress', 'Won', 'Lost'],
  },
];
