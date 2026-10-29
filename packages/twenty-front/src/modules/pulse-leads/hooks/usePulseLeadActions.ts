import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteManyRecords } from '@/object-record/hooks/useDeleteManyRecords';
import { useUpdateManyRecords } from '@/object-record/hooks/useUpdateManyRecords';
import { usePulseTaskActions } from '@/pulse-tasks/hooks/usePulseTaskActions';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type PulseNewLead = {
  name: string;
  website: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leadStatus: string | null;
};

const splitPhone = (phone: string) => {
  const digits = phone.replace(/[^\d+]/g, '');

  if (digits.startsWith('+1') && digits.length === 12) {
    return { callingCode: '+1', number: digits.slice(2), countryCode: 'US' };
  }

  if (!digits.startsWith('+') && digits.length === 10) {
    return { callingCode: '+1', number: digits, countryCode: 'US' };
  }

  return { callingCode: '', number: digits, countryCode: '' };
};

export const usePulseLeadActions = () => {
  const { addTask, currentWorkspaceMemberId } = usePulseTaskActions();
  const { updateManyRecords } = useUpdateManyRecords({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const { deleteManyRecords } = useDeleteManyRecords({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const { createOneRecord: createCompany } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const { createOneRecord: createPerson } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Person,
  });

  const setStatus = (leadIds: string[], leadStatus: string | null) =>
    updateManyRecords({
      recordIdsToUpdate: leadIds,
      updateOneRecordInput: { leadStatus },
    });

  const assignToMe = (leadIds: string[]) =>
    updateManyRecords({
      recordIdsToUpdate: leadIds,
      updateOneRecordInput: { accountOwnerId: currentWorkspaceMemberId },
    });

  const addTaskToLeads = async (
    leadIds: string[],
    task: { title: string; dueAt: Date | null; isUrgent: boolean },
  ) => {
    for (const leadId of leadIds) {
      await addTask({ ...task, companyId: leadId });
    }
  };

  const deleteLeads = (leadIds: string[]) =>
    deleteManyRecords({ recordIdsToDelete: leadIds });

  const createLead = async (lead: PulseNewLead) => {
    const website = lead.website.trim();
    const company = await createCompany({
      name: lead.name.trim(),
      ...(website.length > 0
        ? {
            domainName: {
              primaryLinkUrl: website.startsWith('http')
                ? website
                : `https://${website}`,
            },
          }
        : {}),
      ...(isDefined(lead.leadStatus) ? { leadStatus: lead.leadStatus } : {}),
      accountOwnerId: currentWorkspaceMemberId,
    });

    const hasContact = [lead.firstName, lead.lastName, lead.email, lead.phone]
      .map((value) => value.trim())
      .some((value) => value.length > 0);

    if (hasContact) {
      const phone = splitPhone(lead.phone.trim());

      await createPerson({
        companyId: company.id,
        name: {
          firstName: lead.firstName.trim(),
          lastName: lead.lastName.trim(),
        },
        ...(lead.email.trim().length > 0
          ? { emails: { primaryEmail: lead.email.trim() } }
          : {}),
        ...(phone.number.length > 0
          ? {
              phones: {
                primaryPhoneNumber: phone.number,
                primaryPhoneCallingCode: phone.callingCode,
                primaryPhoneCountryCode: phone.countryCode,
              },
            }
          : {}),
      });
    }

    return company;
  };

  return { setStatus, assignToMe, addTaskToLeads, deleteLeads, createLead };
};
