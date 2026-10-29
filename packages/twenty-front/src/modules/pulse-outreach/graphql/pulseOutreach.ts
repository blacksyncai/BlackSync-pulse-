import gql from 'graphql-tag';

export const PULSE_OUTREACH_STATUS = gql`
  query PulseOutreachStatus {
    pulseOutreachStatus
  }
`;

export const PULSE_SEQUENCE_ENROLLMENTS = gql`
  query PulseSequenceEnrollments {
    pulseSequenceEnrollments
  }
`;

export const PULSE_SEND_EMAIL = gql`
  mutation PulseSendEmail(
    $personId: String!
    $subject: String!
    $body: String!
  ) {
    pulseSendEmail(personId: $personId, subject: $subject, body: $body)
  }
`;

export const PULSE_ENROLL_IN_SEQUENCE = gql`
  mutation PulseEnrollInSequence(
    $sequenceId: String!
    $personIds: [String!]
    $companyIds: [String!]
  ) {
    pulseEnrollInSequence(
      sequenceId: $sequenceId
      personIds: $personIds
      companyIds: $companyIds
    )
  }
`;

export const PULSE_STOP_ENROLLMENT = gql`
  mutation PulseStopEnrollment($enrollmentId: String!) {
    pulseStopEnrollment(enrollmentId: $enrollmentId)
  }
`;
