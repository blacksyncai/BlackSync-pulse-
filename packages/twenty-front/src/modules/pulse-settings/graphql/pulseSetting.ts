import gql from 'graphql-tag';

export const PULSE_SETTING = gql`
  query PulseSetting($key: String!) {
    pulseSetting(key: $key)
  }
`;

export const SET_PULSE_SETTING = gql`
  mutation SetPulseSetting($key: String!, $value: JSON!) {
    setPulseSetting(key: $key, value: $value)
  }
`;
