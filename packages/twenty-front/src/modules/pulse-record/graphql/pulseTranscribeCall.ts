import gql from 'graphql-tag';

export const PULSE_TRANSCRIBE_CALL = gql`
  mutation PulseTranscribeCall($noteId: String!, $recordingUrl: String!) {
    pulseTranscribeCall(noteId: $noteId, recordingUrl: $recordingUrl)
  }
`;
