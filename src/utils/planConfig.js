export const PLAN_FEES = { starter: 140, growth: 300, scale: 600 };
export const PLAN_LIMITS = { starter: Infinity, growth: 30, scale: 75 };
export const OVERAGE_RATES = { starter: 0, growth: 25, scale: 18 };
export const PLAN_YEARLY = { starter: 1400, growth: 3000, scale: 6000 };

export const PLAN_FEATURES = {
  starter: {
    dashboardAccess: false,
    canEditQuestions: false,
    canEditPricing: false,
    canEditBranding: false,
    canEditPDF: false,
    canEditEmail: false,
    canEditMunicipalities: false,
    canExportCSV: false,
    canUploadLogo: false,
    teamMembers: 1,
    hasFreeTrialDays: 0,
    poweredByBadge: true,
  },
  growth: {
    dashboardAccess: true,
    canEditQuestions: true,
    canEditPricing: false,
    canEditBranding: false,
    canEditPDF: false,
    canEditEmail: false,
    canEditMunicipalities: true,
    canExportCSV: true,
    canUploadLogo: true,
    teamMembers: 1,
    hasFreeTrialDays: 0,
    poweredByBadge: true,
  },
  scale: {
    dashboardAccess: true,
    canEditQuestions: true,
    canEditPricing: true,
    canEditBranding: true,
    canEditPDF: true,
    canEditEmail: true,
    canEditMunicipalities: true,
    canExportCSV: true,
    canUploadLogo: true,
    teamMembers: 5,
    hasFreeTrialDays: 14,
    poweredByBadge: true,
  },
};

export function getPlanFeatures(plan) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.growth;
}

export function canAccess(plan, feature) {
  return getPlanFeatures(plan)[feature] === true;
}
