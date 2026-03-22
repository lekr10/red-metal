'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { COMPANY_TYPES, EXCHANGES, JURISDICTIONS, MARKET_CAP_TIERS, MARKET_CAP_TIER_LABELS } from '@/lib/constants'

export default function NewCompanyPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    name:            '',
    ticker:          '',
    exchange:        '',
    type:            '',
    jurisdiction:    '',
    website:         '',
    market_cap_tier: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim())        { setError('Company name is required.'); return }
    if (!form.type)                { setError('Type is required.'); return }
    if (!form.jurisdiction)        { setError('Jurisdiction is required.'); return }

    setSaving(true)

    const { data, error: err } = await supabase
      .from('companies')
      .insert({
        name:            form.name.trim(),
        ticker:          form.ticker.trim().toUpperCase() || null,
        exchange:        form.exchange || null,
        type:            form.type,
        jurisdiction:    form.jurisdiction,
        website:         form.website.trim() || null,
        market_cap_tier: form.market_cap_tier || null,
      })
      .select()
      .single()

    setSaving(false)

    if (err) {
      setError('Could not save company — check your connection and try again.')
      return
    }

    router.push(`/companies/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-700">← Back</Link>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-sm tracking-wide">
          <span className="text-red-600">▲</span> RED METAL
        </span>
      </nav>

      <div className="max-w-xl px-6 py-8">
        <h1 className="text-lg font-semibold mb-6">Add Company</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Filo Mining Corp."
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
            />
          </div>

          {/* Type + Jurisdiction (required) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-600"
              >
                <option value="">Select…</option>
                {COMPANY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Jurisdiction <span className="text-red-500">*</span>
              </label>
              <select
                value={form.jurisdiction}
                onChange={(e) => set('jurisdiction', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-600"
              >
                <option value="">Select…</option>
                {JURISDICTIONS.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ticker + Exchange */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ticker</label>
              <input
                type="text"
                value={form.ticker}
                onChange={(e) => set('ticker', e.target.value)}
                placeholder="e.g. FIL"
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exchange</label>
              <select
                value={form.exchange}
                onChange={(e) => set('exchange', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-600"
              >
                <option value="">Select…</option>
                {EXCHANGES.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://filomining.com"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
            />
          </div>

          {/* Market cap tier */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Market Cap</label>
            <select
              value={form.market_cap_tier}
              onChange={(e) => set('market_cap_tier', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-600"
            >
              <option value="">Select…</option>
              {MARKET_CAP_TIERS.map((t) => (
                <option key={t} value={t}>{MARKET_CAP_TIER_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-900 text-white text-sm px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add Company'}
            </button>
            <Link href="/" className="text-sm text-gray-500 px-4 py-2 border border-gray-300 hover:border-gray-500">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
