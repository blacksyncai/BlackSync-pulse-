import gql from 'graphql-tag';
export const CRM_PHONE_CALL_GRANT = gql`
  mutation CrmPhoneCallGrant(
    $destination: String!
    $number: String
    $record: Boolean!
  ) {
    crmPhoneCallGrant(
      destination: $destination
      number: $number
      record: $record
    )
  }
`;
