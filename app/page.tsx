'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/lib/types'
import { STAGE_LABELS, COMPANY_TYPES, JURISDICTIONS, type Stage } from '@/lib/constants'

const STAGE_COLORS: Record<Stage, string> = {
  watchlist: 'bg-gray-100 text-gray-600',
  screening: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  active:    'bg-green-50 text-green-700 border border-green-200',
  passed:    'bg-blue-50 text-blue-700 border border-blue-200',
  rejected:  'bg-gray-50 text-gray-400 border border-gray-200',
}

const FILTER_STAGES: Stage[] = ['watchlist', 'screening', 'active', 'passed']

function CompanyListInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const stageFilter  = (searchParams.get('stage') as Stage | null) ?? null
  const typeFilter   = searchParams.get('type') ?? ''
  const jurFilter    = searchParams.get('jurisdiction') ?? ''
  const showRejected = searchParams.get('show_rejected') === '1'

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase.from('companies').select('*').order('name')

    if (stageFilter) {
      query = query.eq('stage', stageFilter)
    } else if (!showRejected) {
      query = query.neq('stage', 'rejected')
    }
    if (typeFilter) query = query.eq('type', typeFilter)
    if (jurFilter)  query = query.eq('jurisdiction', jurFilter)

    const { data, error: err } = await query
    if (err) {
      setError('Could not load companies — check your connection and try again.')
    } else {
      setCompanies(data ?? [])
    }
    setLoading(false)
  }, [stageFilter, typeFilter, jurFilter, showRejected])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-sm tracking-wide">
          <span className="text-red-600">▲</span> RED METAL
        </span>
        <Link
          href="/companies/new"
          className="text-sm bg-gray-900 text-white px-3 py-1.5 hover:bg-gray-700"
        >
          + Add Company
        </Link>
      </nav>

      {/* Filters */}
      <div className="border-b border-gray-100 px-6 py-2.5 flex flex-wrap items-center gap-2 bg-gray-50">
        <button
          onClick={() => setParam('stage', null)}
          className={`text-xs px-3 py-1 border ${!stageFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}
        >
          All
        </button>
        {FILTER_STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setParam('stage', stageFilter === s ? null : s)}
            className={`text-xs px-3 py-1 border ${stageFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <select
          value={typeFilter}
          onChange={(e) => setParam('type', e.target.value || null)}
          className="text-xs border border-gray-300 px-2 py-1 bg-white text-gray-700"
        >
          <option value="">All types</option>
          {COMPANY_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>

        <select
          value={jurFilter}
          onChange={(e) => setParam('jurisdiction', e.target.value || null)}
          className="text-xs border border-gray-300 px-2 py-1 bg-white text-gray-700"
        >
          <option value="">All jurisdictions</option>
          {JURISDICTIONS.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-gray-500 ml-1 cursor-pointer">
          <input
            type="checkbox"
            checked={showRejected}
            onChange={(e) => setParam('show_rejected', e.target.checked ? '1' : null)}
            className="w-3 h-3"
          />
          Show rejected
        </label>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {error && (
          <div className="mb-4 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>
        ) : companies.length === 0 ? (
          <div className="text-sm text-gray-400 py-12 text-center">
            {stageFilter || typeFilter || jurFilter
              ? 'No companies match your filters.'
              : "No companies yet. Click '+ Add Company' to get started."}
          </div>
        ) : (
          <>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide py-2 pr-4 w-1/2">Company</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide py-2 pr-4">Type</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide py-2 pr-4">Jurisdiction</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide py-2">Stage</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 pr-4">
                      <Link href={`/companies/${c.id}`} className="font-medium text-gray-900 hover:underline underline-offset-2">
                        {c.name}
                      </Link>
                      {c.ticker && (
                        <span className="ml-2 text-xs text-gray-400 font-mono">
                          {c.ticker}{c.exchange ? ` · ${c.exchange}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 capitalize">{c.type}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{c.jurisdiction}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 ${STAGE_COLORS[c.stage]}`}>
                        {STAGE_LABELS[c.stage]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-400">{companies.length} {companies.length === 1 ? 'company' : 'companies'}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading…</div>}>
      <CompanyListInner />
    </Suspense>
  )
}
