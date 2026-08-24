import { PLAN_FEES } from './planConfig';
const PLAN_FEE = PLAN_FEES;

export function getPlanCounts(clients) {
  return {
    starterCount: clients.filter(c => c.plan === 'starter').length,
    scaleCount:   clients.filter(c => c.plan === 'scale').length,
  };
}

export function calculateMRR(clients) {
  const { starterCount, scaleCount } = getPlanCounts(clients);
  return starterCount * PLAN_FEE.starter + scaleCount * PLAN_FEE.scale;
}

// Real monthly revenue from the client_billing table (synced from Stripe by the backend).
// effective_amount is what each client actually pays after coupons/discounts, so a client
// on a 100%-forever promo counts as 0 here even though their plan says otherwise.
// Falls back to plan-price math when billing rows are missing (sync down, table empty),
// so revenue never shows blank because of a hiccup.
export function calculateRealMRR(clients, billingRows) {
  if (!billingRows || billingRows.length === 0) return calculateMRR(clients);
  return billingRows
    .filter(b => b.status === 'active')
    .reduce((sum, b) => sum + Number(b.effective_amount || 0), 0);
}

// Quick lookup map: client_id -> billing row.
export function billingByClient(billingRows) {
  const map = {};
  for (const b of billingRows || []) map[b.client_id] = b;
  return map;
}
