import { AggregateOperations, ViewType, defineView } from 'twenty-sdk/define';
import { BORROWER_ON_LOAN_FIELD_ID } from '../fields/borrower-on-loan.field';
import {
  LOAN_LOAN_AMOUNT_FIELD_ID,
  LOAN_LOAN_STAGE_FIELD_ID,
  LOAN_LOAN_STAGE_OPTIONS,
  LOAN_LOAN_TYPE_FIELD_ID,
  LOAN_NAME_FIELD_ID,
  LOAN_OBJECT_ID,
} from '../objects/loan.object';

export const LOAN_PIPELINE_VIEW_ID = 'f990d1ff-c90c-579d-b885-82a17230b72c';

const GROUP_IDS = [
  '7cace25f-35ca-5a83-882f-d9886b5d58dd',
  '65a40e0f-2149-5f00-bd1f-bd52c51a89aa',
  '8fabb68d-ef42-5176-9222-8c4cca15ebf8',
  'cca7fb8c-12f5-5ea1-ae2a-b144ebcb2cc7',
  '54f23058-29cc-5dc6-b47c-fa88af8b8ea6',
  '03e4e67c-c8bd-5f69-a339-66ec76a192dc',
  '10207e50-6e75-5350-86de-d3610d5cc6f9',
  'c0969b43-56b5-5f26-a05b-011d0caf387d',
  '86a1f2fb-25d9-5155-a1c4-b1df552e1676',
];

export default defineView({
  universalIdentifier: LOAN_PIPELINE_VIEW_ID,
  name: 'Loan Pipeline',
  objectUniversalIdentifier: LOAN_OBJECT_ID,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier: LOAN_LOAN_STAGE_FIELD_ID,
  kanbanAggregateOperation: AggregateOperations.SUM,
  kanbanAggregateOperationFieldMetadataUniversalIdentifier:
    LOAN_LOAN_AMOUNT_FIELD_ID,
  fields: [
    {
      universalIdentifier: '3f790f88-3702-52a9-b966-60b9496d797c',
      fieldMetadataUniversalIdentifier: LOAN_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: 'e3448691-3779-5e00-96bb-8dc214db3c7a',
      fieldMetadataUniversalIdentifier: LOAN_LOAN_AMOUNT_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '9b019101-2296-5fb2-8d0f-186146c3a65a',
      fieldMetadataUniversalIdentifier: LOAN_LOAN_TYPE_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'a0e6b148-0a48-5b05-974d-9d609614048c',
      fieldMetadataUniversalIdentifier: BORROWER_ON_LOAN_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
  groups: LOAN_LOAN_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
