// Single source of truth for checklist criterion slugs.
// These must match the values seeded by the Postgres trigger in the migration.

export const CHECKLIST_CRITERIA = [
  {
    slug: 'jurisdiction_tier',
    group: 'Jurisdiction',
    label: 'Tier 1 or 2 mining jurisdiction?',
  },
  {
    slug: 'jurisdiction_no_blockers',
    group: 'Jurisdiction',
    label: 'No active permitting or legal blockers?',
  },
  {
    slug: 'resource_grade',
    group: 'Resource / Prospectivity',
    label: 'Grade ≥ 0.35% CuEq or land highly prospective?',
  },
  {
    slug: 'resource_scale',
    group: 'Resource / Prospectivity',
    label: 'Asset scale large enough to matter (>500Mt potential)?',
  },
  {
    slug: 'management_track_record',
    group: 'Management',
    label: 'Team has prior discovery or development track record?',
  },
  {
    slug: 'management_insider_ownership',
    group: 'Management',
    label: 'Insider ownership > 10%?',
  },
  {
    slug: 'balance_sheet_runway',
    group: 'Balance Sheet',
    label: '12+ months cash runway?',
  },
] as const

export type CriterionSlug = typeof CHECKLIST_CRITERIA[number]['slug']

export const STAGES = ['watchlist', 'screening', 'active', 'passed', 'rejected'] as const
export type Stage = typeof STAGES[number]

export const STAGE_LABELS: Record<Stage, string> = {
  watchlist: 'Watchlist',
  screening: 'Screening',
  active: 'Active',
  passed: 'Passed',
  rejected: 'Rejected',
}

export const EXCHANGES = ['TSX-V', 'TSX', 'ASX', 'OTC', 'NYSE', 'Other'] as const
export type Exchange = typeof EXCHANGES[number]

export const COMPANY_TYPES = ['explorer', 'developer', 'producer'] as const
export type CompanyType = typeof COMPANY_TYPES[number]

export const JURISDICTIONS = [
  'BC Canada',
  'Ontario Canada',
  'Quebec Canada',
  'Chile',
  'Peru',
  'Argentina',
  'Ecuador',
  'USA',
  'Australia',
  'DRC',
  'Other',
] as const
export type Jurisdiction = typeof JURISDICTIONS[number]

export const MARKET_CAP_TIERS = ['micro', 'small', 'mid'] as const
export type MarketCapTier = typeof MARKET_CAP_TIERS[number]

// micro: <$50M USD, small: $50–300M USD, mid: $300M–2B USD
export const MARKET_CAP_TIER_LABELS: Record<MarketCapTier, string> = {
  micro: 'Micro (<$50M)',
  small: 'Small ($50–300M)',
  mid: 'Mid ($300M–2B)',
}
