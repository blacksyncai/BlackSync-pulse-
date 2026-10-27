import { defineApplicationRole } from 'twenty-sdk/define';

export default defineApplicationRole({
  universalIdentifier: 'f5309843-e6c9-539f-8d10-87e7aac7b8ca',
  label: 'Real Estate Cloud default role',
  description: 'Role the Real Estate Cloud runs as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
});
