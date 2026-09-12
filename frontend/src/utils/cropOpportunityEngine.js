/**
 * Isolated prototype crop intelligence data and rule-based decision engine.
 * Note: Uses deterministic rules based on simulated market indicators.
 * Can be replaced by real ML models / external APIs in the future.
 */

export const CROP_BASE_INTELLIGENCE = {
  Tomato: {
    crop: 'Tomato',
    demandOutlook: 'High',
    supplyPressure: 'Medium',
    priceTrend: 'Rising',
    baseScore: 86,
    riskLevel: 'Low',
    basePrice: 35,
    projectedPriceRange: '₹32 - ₹42 / kg',
    recommendedAction: 'Tomato shows strong demand with moderate supply pressure. Consider growing with a controlled quantity.',
    optimalPeriod: '1-3 Months',
    regionalHotspots: ['Dharmapuri', 'Kolar', 'Madanapalle', 'Nashik'],
  },
  Banana: {
    crop: 'Banana',
    demandOutlook: 'High',
    supplyPressure: 'Low',
    priceTrend: 'Rising',
    baseScore: 92,
    riskLevel: 'Low',
    basePrice: 45,
    projectedPriceRange: '₹40 - ₹55 / kg',
    recommendedAction: 'Banana has excellent demand and low supply pressure. High profitability expected for upcoming harvest cycle.',
    optimalPeriod: '6+ Months',
    regionalHotspots: ['Tiruchirappalli', 'Theni', 'Jalgaon', 'Hajipur'],
  },
  Onion: {
    crop: 'Onion',
    demandOutlook: 'Medium',
    supplyPressure: 'High',
    priceTrend: 'Stable',
    baseScore: 62,
    riskLevel: 'Medium',
    basePrice: 25,
    projectedPriceRange: '₹20 - ₹28 / kg',
    recommendedAction: 'Onion exhibits stable demand but higher regional supply pressure. Monitor harvest timings to avoid local market glut.',
    optimalPeriod: '3-6 Months',
    regionalHotspots: ['Nashik', 'Lasalgaon', 'Perambalur', 'Pune'],
  },
  Carrot: {
    crop: 'Carrot',
    demandOutlook: 'Medium',
    supplyPressure: 'Medium',
    priceTrend: 'Stable',
    baseScore: 75,
    riskLevel: 'Low',
    basePrice: 32,
    projectedPriceRange: '₹28 - ₹38 / kg',
    recommendedAction: 'Carrot market is stable with steady institutional demand. Consistent returns expected for grade-A yield.',
    optimalPeriod: '1-3 Months',
    regionalHotspots: ['Ooty', 'Nilgiris', 'Indore', 'Kalyan'],
  },
  Paddy: {
    crop: 'Paddy',
    demandOutlook: 'High',
    supplyPressure: 'High',
    priceTrend: 'Stable',
    baseScore: 68,
    riskLevel: 'Low',
    basePrice: 22,
    projectedPriceRange: '₹20 - ₹25 / kg',
    recommendedAction: 'Paddy has strong procurement backing and steady buyer volume. Minimal price fluctuation expected.',
    optimalPeriod: '3-6 Months',
    regionalHotspots: ['Thanjavur', 'West Godavari', 'Karnal', 'Burdwan'],
  },
}

export function analyzeCropOpportunity({
  crop = 'Tomato',
  region = '',
  quantity = 1000,
  harvestPeriod = '1-3 Months',
  expectedPrice = null,
}) {
  const base = CROP_BASE_INTELLIGENCE[crop] || CROP_BASE_INTELLIGENCE['Tomato']
  const parsedQty = parseFloat(quantity) || 1000
  const parsedExpectedPrice = expectedPrice !== null && expectedPrice !== '' ? parseFloat(expectedPrice) : null

  let opportunityScore = base.baseScore
  let riskLevel = base.riskLevel
  let oversupplyWarning = null
  let supplyPressure = base.supplyPressure
  let demandOutlook = base.demandOutlook
  let priceTrend = base.priceTrend

  // Rule 1: High quantity checks for oversupply risk
  if (parsedQty >= 2500) {
    if (base.supplyPressure === 'High' || base.supplyPressure === 'Medium') {
      oversupplyWarning = `Warning: High planned production (${parsedQty.toLocaleString()} kg) in a ${base.supplyPressure.toLowerCase()}-supply environment may cause price depression. Consider phased planting or buyer contracts.`
      opportunityScore = Math.max(45, opportunityScore - 12)
      if (riskLevel === 'Low') riskLevel = 'Medium'
      else if (riskLevel === 'Medium') riskLevel = 'High'
    }
  }

  let recommendedAction = base.recommendedAction
  // Rule 2: Expected Price analysis relative to market baseline
  if (parsedExpectedPrice !== null && !isNaN(parsedExpectedPrice) && parsedExpectedPrice > 0) {
    const diffPercent = ((parsedExpectedPrice - base.basePrice) / base.basePrice) * 100
    if (diffPercent > 30) {
      riskLevel = 'High'
      opportunityScore = Math.max(30, opportunityScore - 15)
      recommendedAction = `Your expected price (₹${parsedExpectedPrice}/kg) is significantly higher than projected market average (₹${base.basePrice}/kg). High risk of unsold inventory.`
    } else if (diffPercent > 10) {
      opportunityScore = Math.min(99, opportunityScore + 3)
    } else if (diffPercent < -15) {
      opportunityScore = Math.min(99, opportunityScore + 8)
    }
  }

  if (oversupplyWarning && !recommendedAction.includes('oversupply') && !recommendedAction.includes('significantly higher')) {
    recommendedAction = `${base.recommendedAction} (Note: Stagger your harvest due to high volume).`
  }

  return {
    crop: base.crop,
    region: region.trim() || 'General Region',
    plannedQuantity: parsedQty,
    harvestPeriod: harvestPeriod || base.optimalPeriod,
    expectedPrice: parsedExpectedPrice,
    basePrice: base.basePrice,
    projectedPriceRange: base.projectedPriceRange,
    demandOutlook,
    supplyPressure,
    priceTrend,
    opportunityScore: Math.round(opportunityScore),
    riskLevel,
    oversupplyWarning,
    recommendedAction,
    regionalHotspots: base.regionalHotspots,
  }
}

export function getAllCropOpportunities() {
  return Object.keys(CROP_BASE_INTELLIGENCE).map((cropName) =>
    analyzeCropOpportunity({ crop: cropName })
  )
}
