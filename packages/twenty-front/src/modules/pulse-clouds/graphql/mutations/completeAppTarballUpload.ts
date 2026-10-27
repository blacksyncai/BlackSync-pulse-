import gql from 'graphql-tag';

export const COMPLETE_APP_TARBALL_UPLOAD = gql`
  mutation CompleteAppTarballUpload($fileId: UUID!) {
    completeAppTarballUpload(fileId: $fileId) {
      id
      universalIdentifier
    }
  }
`;
