import { type PulseDialerLead } from '@/pulse-dialer/states/pulseDialerSessionState';
import { type PulseLead } from '@/pulse-leads/types/PulseLead';

export const toPulseDialerQueue = (leads: PulseLead[]): PulseDialerLead[] =>
  leads.flatMap((lead) => {
    const contact = lead.primaryContact;

    if (contact === null || contact.phone === null || contact.phone === '') {
      return [];
    }

    return [
      {
        companyId: lead.id,
        personId: contact.id,
        leadName: lead.name ?? '',
        contactName: [contact.firstName, contact.lastName]
          .filter(Boolean)
          .join(' '),
        phone: contact.phone,
      },
    ];
  });
