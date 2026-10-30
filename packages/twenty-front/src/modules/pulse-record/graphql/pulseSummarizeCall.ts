import gql from 'graphql-tag';

export const PULSE_SUMMARIZE_CALL = gql`
  mutation PulseSummarizeCall($noteId: String!) {
    pulseSummarizeCall(noteId: $noteId)
  }
`;
