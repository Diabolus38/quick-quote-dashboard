export const PLAN_FEES = { starter: 140, growth: 300, scale: 600, enterprise: 0 };
export const PLAN_LIMITS = { starter: Infinity, growth: 30, scale: 75, enterprise: Infinity };
export const OVERAGE_RATES = { starter: 0, growth: 25, scale: 18, enterprise: 0 };
export const PLAN_YEARLY = { starter: 1400, growth: 3000, scale: 6000, enterprise: 0 };

export const PLAN_FEATURES = {
  starter: {
    dashboardAccess: true,
    canEditQuestions: false,
    canEditPricing: false,
    canEditBranding: false,
    canEditPDF: false,
    canEditEmail: false,
    canEditMunicipalities: false,
    canExportCSV: false,
    canUploadLogo: false,
    canViewLeads: true,
    canViewEmbed: false,
    teamMembers: 1,
    hasFreeTrialDays: 0,
    poweredByBadge: true,
    show_powered_by: true,
  },
  growth: {
    dashboardAccess: true,
    canEditQuestions: true,
    canEditPricing: true,
    canEditMunicipalities: true,
    canEditBranding: false,
    canEditPDF: false,
    canEditEmail: false,
    canExportCSV: true,
    canUploadLogo: true,
    canViewLeads: true,
    canViewEmbed: true,
    teamMembers: 1,
    hasFreeTrialDays: 0,
    poweredByBadge: true,
    show_powered_by: true,
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
    canViewLeads: true,
    canViewEmbed: true,
    teamMembers: 5,
    hasFreeTrialDays: 14,
    poweredByBadge: true,
    show_powered_by: true,
  },
  enterprise: {
    dashboardAccess: true,
    canEditQuestions: true,
    canEditPricing: true,
    canEditBranding: true,
    canEditPDF: true,
    canEditEmail: true,
    canEditMunicipalities: true,
    canExportCSV: true,
    canUploadLogo: true,
    canViewLeads: true,
    canViewEmbed: true,
    teamMembers: Infinity,
    hasFreeTrialDays: 0,
    poweredByBadge: false,
    show_powered_by: false,
  },
};

export function getPlanFeatures(plan) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.growth;
}

export function canAccess(plan, feature) {
  return getPlanFeatures(plan)[feature] === true;
}
