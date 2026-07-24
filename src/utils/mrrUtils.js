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
