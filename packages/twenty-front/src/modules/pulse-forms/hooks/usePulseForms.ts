import { gql } from '@apollo/client';
import { useApolloClient, useQuery } from '@apollo/client/react';
import {
  type PulseForm,
  type PulseFormDefinition,
  type PulseFormSubmission,
} from '@/pulse-forms/types/PulseForm';

const FORMS = gql`
  query PulseForms {
    pulseForms
  }
`;
const SAVE = gql`
  mutation SavePulseForm($definition: JSON!, $id: String, $revision: Int) {
    savePulseForm(definition: $definition, id: $id, revision: $revision)
  }
`;
const SUBMISSIONS = gql`
  query PulseFormSubmissions($id: String!) {
    pulseFormSubmissions(id: $id)
  }
`;

export const usePulseForms = () => {
  const client = useApolloClient();
  const { data, loading, error, refetch } = useQuery<{
    pulseForms: PulseForm[];
  }>(FORMS);
  const save = async (definition: PulseFormDefinition, form?: PulseForm) => {
    const result = await client.mutate<{ savePulseForm: PulseForm }>({
      mutation: SAVE,
      variables: { definition, id: form?.id, revision: form?.revision },
    });
    await refetch();
    return result.data?.savePulseForm;
  };
  const submissions = async (id: string) => {
    const result = await client.query<{
      pulseFormSubmissions: PulseFormSubmission[];
    }>({ query: SUBMISSIONS, variables: { id }, fetchPolicy: 'network-only' });
    return result.data?.pulseFormSubmissions ?? [];
  };
  return {
    forms: data?.pulseForms ?? [],
    loading,
    error,
    refetch,
    save,
    submissions,
  };
};
