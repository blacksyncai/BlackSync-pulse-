import gql from 'graphql-tag';

export const PLIVO_VOICE_ACCESS = gql`
  query PlivoVoiceAccess {
    plivoVoiceAccess {
      isEnabled
      accessToken
    }
  }
`;
