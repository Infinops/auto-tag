export default {
  NAME: {
    name: 'Name',
    value: process.env.DEFAULT_NAME || 'unset'
  },
  APPLICATION: {
    name: 'Application',
    value: process.env.DEFAULT_APPLICATION || 'unknown'
  },
  APPLICATION_OWNER: {
    name: 'Application-Owner',
    value: process.env.DEFAULT_APPLICATION_OWNER || 'unknown'
  },
  COMPLIANCE: {
    name: 'Compliance',
    value: process.env.DEFAULT_COMPLIANCE || 'unknown'
  },
  CRITICAL_STATUS: {
    name: 'Critical-Status',
    value: process.env.DEFAULT_CRITICAL_STATUS || 'unknown'
  },
  ENV: {
    name: 'Environment',
    value: process.env.DEFAULT_ENV || 'unknown'
  },
  LIFECYCLE: {
    name: 'Lifecycle',
    value: process.env.DEFAULT_LIFECYCLE || 'unknown'
  },
  PROJECT: {
    name: 'Project',
    value: process.env.DEFAULT_PROJECT || 'unknown'
  },
  PROJECT_STATUS: {
    name: 'Project-Status',
    value: process.env.DEFAULT_PROJECT_STATUS || 'unknown'
  },
  TEAM: {
    name: 'Team',
    value: process.env.DEFAULT_TEAM || 'unknown'
  },
  USERDATA: {
    name: 'User-Data',
    value: process.env.DEFAULT_USERDATA || 'unknown'
  }
};
