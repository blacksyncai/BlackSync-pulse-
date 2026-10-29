import {
  PULSE_ENROLL_IN_SEQUENCE,
  PULSE_OUTREACH_STATUS,
  PULSE_SEND_EMAIL,
  PULSE_SEQUENCE_ENROLLMENTS,
  PULSE_STOP_ENROLLMENT,
} from '@/pulse-outreach/graphql/pulseOutreach';
import {
  type PulseEmailTemplate,
  type PulseEnrollment,
  type PulseOutreachStatus,
  type PulseSequence,
} from '@/pulse-outreach/types/PulseOutreach';
import { usePulseSetting } from '@/pulse-settings/hooks/usePulseSetting';
import { useApolloClient, useQuery } from '@apollo/client/react';

export const useEmailTemplates = () => {
  const { value, save } = usePulseSetting<PulseEmailTemplate[]>(
    'emailTemplates',
    [],
  );

  return { templates: value, saveTemplates: save };
};

export const useSequences = () => {
  const { value, save } = usePulseSetting<PulseSequence[]>('sequences', []);

  return { sequences: value, saveSequences: save };
};

export const useOutreachStatus = () => {
  const { data } = useQuery<{ pulseOutreachStatus: PulseOutreachStatus }>(
    PULSE_OUTREACH_STATUS,
  );

  return data?.pulseOutreachStatus ?? null;
};

export const useSequenceEnrollments = () => {
  const { data, refetch } = useQuery<{
    pulseSequenceEnrollments: PulseEnrollment[];
  }>(PULSE_SEQUENCE_ENROLLMENTS, { fetchPolicy: 'cache-and-network' });

  return { enrollments: data?.pulseSequenceEnrollments ?? [], refetch };
};

export const useOutreachActions = () => {
  const apolloClient = useApolloClient();

  const sendEmail = async (variables: {
    personId: string;
    subject: string;
    body: string;
  }) => {
    await apolloClient.mutate({ mutation: PULSE_SEND_EMAIL, variables });
  };

  const enroll = async (variables: {
    sequenceId: string;
    personIds?: string[];
    companyIds?: string[];
  }) => {
    const { data } = await apolloClient.mutate<{
      pulseEnrollInSequence: {
        enrolled: number;
        alreadyEnrolled: number;
        missingEmail: number;
      };
    }>({
      mutation: PULSE_ENROLL_IN_SEQUENCE,
      variables,
      refetchQueries: [PULSE_SEQUENCE_ENROLLMENTS],
    });

    return data?.pulseEnrollInSequence;
  };

  const stopEnrollment = async (enrollmentId: string) => {
    await apolloClient.mutate({
      mutation: PULSE_STOP_ENROLLMENT,
      variables: { enrollmentId },
      refetchQueries: [PULSE_SEQUENCE_ENROLLMENTS],
    });
  };

  return { sendEmail, enroll, stopEnrollment };
};
