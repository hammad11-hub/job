export const PLANS = {
  free: {
    maxActiveJobs: 1,
    featuredJobsPerMonth: 0,
    canViewAIScores: false,
    canExportCSV: false,
    analyticsAccess: false,
  },
  pro: {
    maxActiveJobs: Infinity,
    featuredJobsPerMonth: 3,
    canViewAIScores: true,
    canExportCSV: false,
    analyticsAccess: true,
  },
  enterprise: {
    maxActiveJobs: Infinity,
    featuredJobsPerMonth: 10,
    canViewAIScores: true,
    canExportCSV: true,
    analyticsAccess: true,
  },
};
