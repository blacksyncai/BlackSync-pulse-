import gql from 'graphql-tag';

const CLOSE_IMPORT_STATUS_FIELDS = `
  state
  organizationName
  currentStep
  error
  startedAt
  finishedAt
  counts {
    companies
    people
    opportunities
    notes
    calls
    emails
    texts
    tasks
  }
`;

export const CLOSE_IMPORT_STATUS = gql`
  query CloseImportStatus {
    closeImportStatus {
      ${CLOSE_IMPORT_STATUS_FIELDS}
    }
  }
`;

export const START_CLOSE_IMPORT = gql`
  mutation StartCloseImport($apiKey: String!) {
    startCloseImport(apiKey: $apiKey) {
      ${CLOSE_IMPORT_STATUS_FIELDS}
    }
  }
`;

export const REMOVE_CLOSE_IMPORT = gql`
  mutation RemoveCloseImport {
    removeCloseImport {
      ${CLOSE_IMPORT_STATUS_FIELDS}
    }
  }
`;
