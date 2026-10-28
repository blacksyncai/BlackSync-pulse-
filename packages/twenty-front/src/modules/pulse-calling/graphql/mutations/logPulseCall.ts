import gql from 'graphql-tag';

export const LOG_PULSE_CALL = gql`
  mutation LogPulseCall($input: LogPulseCallInput!) {
    logPulseCall(input: $input)
  }
`;
