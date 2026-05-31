const PLAN_FEE = { starter: 300, growth: 600, scale: 1149 };

export function getPlanCounts(clients) {
  return {
    starterCount: clients.filter(c => c.plan === 'starter').length,
    growthCount:  clients.filter(c => c.plan === 'growth').length,
    scaleCount:   clients.filter(c => c.plan === 'scale').length,
  };
}

export function calculateMRR(clients) {
  const { starterCount, growthCount, scaleCount } = getPlanCounts(clients);
  return starterCount * PLAN_FEE.starter + growthCount * PLAN_FEE.growth + scaleCount * PLAN_FEE.scale;
}
