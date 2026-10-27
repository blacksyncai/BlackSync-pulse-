import { defineApplicationRole } from 'twenty-sdk/define';

export default defineApplicationRole({
  universalIdentifier: '6fb87680-8004-5ec2-bfec-eaf9dae5e903',
  label: 'Corporate Sales Cloud default role',
  description: 'Role the Corporate Sales Cloud runs as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
});
