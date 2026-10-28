import gql from 'graphql-tag';

export const PULSE_CREATE_FIELD = gql`
  mutation PulseCreatePipelineField($input: CreateOneFieldMetadataInput!) {
    createOneField(input: $input) {
      id
      name
    }
  }
`;

export const PULSE_UPDATE_FIELD = gql`
  mutation PulseUpdatePipelineField($input: UpdateOneFieldMetadataInput!) {
    updateOneField(input: $input) {
      id
    }
  }
`;

export const PULSE_CREATE_VIEW = gql`
  mutation PulseCreatePipelineView($input: CreateViewInput!) {
    createView(input: $input) {
      id
    }
  }
`;

export const PULSE_CREATE_VIEW_FIELDS = gql`
  mutation PulseCreatePipelineViewFields($inputs: [CreateViewFieldInput!]!) {
    createManyViewFields(inputs: $inputs) {
      id
    }
  }
`;

export const PULSE_CREATE_VIEW_FILTER = gql`
  mutation PulseCreatePipelineViewFilter($input: CreateViewFilterInput!) {
    createViewFilter(input: $input) {
      id
    }
  }
`;

export const PULSE_CREATE_NAVIGATION_MENU_ITEM = gql`
  mutation PulseCreatePipelineNavigationMenuItem(
    $input: CreateNavigationMenuItemInput!
  ) {
    createNavigationMenuItem(input: $input) {
      id
    }
  }
`;
