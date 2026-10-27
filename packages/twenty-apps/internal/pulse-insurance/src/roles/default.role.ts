import { defineApplicationRole } from 'twenty-sdk/define';

export default defineApplicationRole({
  universalIdentifier: 'ab5b213b-29c5-502a-9bdc-3366e618f4d0',
  label: 'Insurance Cloud default role',
  description: 'Role the Insurance Cloud runs as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
});
