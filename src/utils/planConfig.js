export const PLAN_FEES = { starter: 1400, growth: 3000, scale: 6000, enterprise: 0, free_trial: 0 };
export const PLAN_LIMITS = { starter: Infinity, growth: 30, scale: 75, enterprise: Infinity, free_trial: Infinity };
export const OVERAGE_RATES = { starter: 0, growth: 250, scale: 180, enterprise: 0, free_trial: 0 };
export const PLAN_YEARLY = { starter: 14000, growth: 30000, scale: 60000 };

// Trial-to-paid conversion: when a free_trial client selects a plan after trial expiry, their plan
// field is updated directly (starter/growth/scale) with no payment step, since Stripe is not yet
// integrated. Once Stripe is live this conversion will trigger an actual subscription checkout
// before updating the plan.
//
// free_trial IS self-service today via the public signup form (SignupPage.jsx PLAN_CARDS). Repeat
// trial abuse via email aliasing is blocked server-side by the qq360_block_repeat_free_trial trigger
// on the clients table in Supabase (see migration run 2026-07-19) — do not remove that trigger without
// replacing the protection it provides.
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
    canEditPdfContent:  false,
    canEditPdfBranding: false,
    canRemovePoweredBy: false,
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
    canEditPdfContent:  true,
    canEditPdfBranding: false,
    canRemovePoweredBy: false,
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
    hasFreeTrialDays: 0,
    poweredByBadge: true,
    show_powered_by: true,
    canEditPdfContent:  true,
    canEditPdfBranding: true,
    canRemovePoweredBy: false,
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
    canEditPdfContent:  true,
    canEditPdfBranding: true,
    canRemovePoweredBy: true,
  },
  free_trial: {
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
    trialPlan: true,
    canEditPdfContent:  true,
    canEditPdfBranding: true,
    canRemovePoweredBy: false,
  },
};

export function getPlanFeatures(plan) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.growth;
}

export function canAccess(plan, feature) {
  return getPlanFeatures(plan)[feature] === true;
}
