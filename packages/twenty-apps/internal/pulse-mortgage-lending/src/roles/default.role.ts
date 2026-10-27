import { defineApplicationRole } from 'twenty-sdk/define';

export default defineApplicationRole({
  universalIdentifier: 'b4646b89-2abe-5b1f-abd7-2aea7e223082',
  label: 'Mortgage & Lending Cloud default role',
  description: 'Role the Mortgage & Lending Cloud runs as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
});
