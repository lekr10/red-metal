import type { Stage, CompanyType, Exchange, Jurisdiction, MarketCapTier } from './constants'

export interface Company {
  id: string
  name: string
  ticker: string | null
  exchange: Exchange | null
  type: CompanyType
  jurisdiction: Jurisdiction
  website: string | null
  market_cap_tier: MarketCapTier | null
  stage: Stage
  created_at: string
  updated_at: string
  checklist_items?: ChecklistItem[]
  journal_entries?: JournalEntry[]
}

export interface ChecklistItem {
  id: string
  company_id: string
  criterion: string
  checked: boolean
  updated_at: string
}

export interface JournalEntry {
  id: string
  company_id: string
  content: string
  created_at: string
}
