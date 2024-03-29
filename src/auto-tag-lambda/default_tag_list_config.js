export default {
  NAME: {
    name: 'Name',
    value: process.env.DEFAULT_NAME || 'unset'
  },
  APPLICATION: {
    name: 'application',
    value: process.env.DEFAULT_APPLICATION || 'unknown'
  },
  APPLICATION_OWNER: {
    name: 'application_owner',
    value: process.env.DEFAULT_APPLICATION_OWNER || 'unknown'
  },
  COMPLIANCE: {
    name: 'compliance',
    value: process.env.DEFAULT_COMPLIANCE || 'unknown'
  },
  CRITICAL_STATUS: {
    name: 'critical_status',
    value: process.env.DEFAULT_CRITICAL_STATUS || 'unknown'
  },
  ENV: {
    name: 'env',
    value: process.env.DEFAULT_ENV || 'unknown'
  },
  LIFECYCLE: {
    name: 'lifecycle',
    value: process.env.DEFAULT_LIFECYCLE || 'unknown'
  },
  PROJECT: {
    name: 'project',
    value: process.env.DEFAULT_PROJECT || 'unknown'
  },
  PROJECT_STATUS: {
    name: 'project_status',
    value: process.env.DEFAULT_PROJECT_STATUS || 'unknown'
  },
  TEAM: {
    name: 'team',
    value: process.env.DEFAULT_TEAM || 'unknown'
  },
  USERDATA: {
    name: 'userData',
    value: process.env.DEFAULT_USERDATA || 'unknown'
  }
};
