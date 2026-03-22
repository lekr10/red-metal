'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Company, ChecklistItem, JournalEntry } from '@/lib/types'
import {
  CHECKLIST_CRITERIA,
  STAGE_LABELS,
  STAGES,
  type Stage,
} from '@/lib/constants'

const STAGE_COLORS: Record<Stage, string> = {
  watchlist: 'bg-gray-100 text-gray-600',
  screening: 'bg-yellow-50 text-yellow-700',
  active:    'bg-green-50 text-green-700',
  passed:    'bg-blue-50 text-blue-700',
  rejected:  'bg-gray-50 text-gray-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Group checklist criteria by their group label
const CRITERIA_GROUPS = CHECKLIST_CRITERIA.reduce<Record<string, typeof CHECKLIST_CRITERIA>>((acc, c) => {
  if (!acc[c.group]) acc[c.group] = [] as unknown as typeof CHECKLIST_CRITERIA
  ;(acc[c.group] as unknown as (typeof CHECKLIST_CRITERIA[number])[]).push(c)
  return acc
}, {} as Record<string, typeof CHECKLIST_CRITERIA>)

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [company,  setCompany]  = useState<Company | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [entries,  setEntries]  = useState<JournalEntry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // Journal note state
  const [noteText,  setNoteText]  = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError,  setNoteError]  = useState<string | null>(null)

  // Stage change state
  const [stageError, setStageError] = useState<string | null>(null)
  const [graduateError, setGraduateError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('companies')
      .select('*, checklist_items(*), journal_entries(*)')
      .eq('id', id)
      .single()

    if (err || !data) {
      setError('Could not load company — check your connection and try again.')
      setLoading(false)
      return
    }

    setCompany(data as Company)
    setChecklist((data.checklist_items ?? []) as ChecklistItem[])
    // Sort journal entries newest-first
    const sorted = [...(data.journal_entries ?? [])] as JournalEntry[]
    sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setEntries(sorted)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Checklist ──────────────────────────────────────────────────────────────

  async function toggleCriterion(item: ChecklistItem) {
    const newChecked = !item.checked

    // Optimistic update
    setChecklist((prev) =>
      prev.map((c) => c.id === item.id ? { ...c, checked: newChecked } : c)
    )

    const { error: err } = await supabase
      .from('checklist_items')
      .update({ checked: newChecked })
      .eq('id', item.id)

    if (err) {
      // Revert
      setChecklist((prev) =>
        prev.map((c) => c.id === item.id ? { ...c, checked: item.checked } : c)
      )
      setError('Could not save — check your connection and try again.')
    }
  }

  const checkedCount  = checklist.filter((c) => c.checked).length
  const allChecked    = checkedCount === 7
  const canGraduate   = allChecked && company?.stage === 'screening'

  async function handleGraduate() {
    if (!company || !canGraduate) return
    setGraduateError(null)

    const { error: err } = await supabase
      .from('companies')
      .update({ stage: 'active' })
      .eq('id', company.id)

    if (err) {
      setGraduateError('Could not graduate — check your connection and try again.')
      return
    }
    setCompany((prev) => prev ? { ...prev, stage: 'active' } : prev)
  }

  // ── Stage dropdown ─────────────────────────────────────────────────────────

  async function handleStageChange(newStage: Stage) {
    if (!company || newStage === company.stage) return
    setStageError(null)

    const { error: err } = await supabase
      .from('companies')
      .update({ stage: newStage })
      .eq('id', company.id)

    if (err) {
      setStageError('Could not update stage — check your connection and try again.')
      return
    }
    setCompany((prev) => prev ? { ...prev, stage: newStage } : prev)
  }

  // ── Journal ────────────────────────────────────────────────────────────────

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteText.trim() || !company) return
    setNoteError(null)
    setNoteSaving(true)

    const { data, error: err } = await supabase
      .from('journal_entries')
      .insert({ company_id: company.id, content: noteText.trim() })
      .select()
      .single()

    setNoteSaving(false)

    if (err || !data) {
      setNoteError("Couldn't save note — check your connection and try again.")
      return
    }

    setNoteText('')
    setEntries((prev) => [data as JournalEntry, ...prev])
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>

  if (error && !company) return (
    <div className="p-6">
      <p className="text-sm text-red-600 mb-4">{error}</p>
      <Link href="/" className="text-sm text-gray-500 hover:underline">← Back to companies</Link>
    </div>
  )

  if (!company) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-700">← Back</Link>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-sm tracking-wide">
          <span className="text-red-600">▲</span> RED METAL
        </span>
      </nav>

      {/* Company header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{company.name}</h1>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {company.ticker && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5">
                  {company.ticker}{company.exchange ? ` · ${company.exchange}` : ''}
                </span>
              )}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 capitalize">{company.type}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5">{company.jurisdiction}</span>
              {company.market_cap_tier && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 capitalize">{company.market_cap_tier} cap</span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Website ↗
                </a>
              )}
            </div>
          </div>

          {/* Stage control */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <select
              value={company.stage}
              onChange={(e) => handleStageChange(e.target.value as Stage)}
              className={`text-xs px-2 py-1 border-0 font-medium cursor-pointer ${STAGE_COLORS[company.stage]}`}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
            {stageError && <p className="text-xs text-red-500">{stageError}</p>}
          </div>
        </div>
      </div>

      {/* Two-column layout: journal (left/center) + checklist (right) */}
      <div className="flex divide-x divide-gray-100 min-h-[calc(100vh-120px)]">

        {/* Journal — center column */}
        <div className="flex-1 px-6 py-5 min-w-0">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Research Notes</h2>

          {/* New note form */}
          <form onSubmit={handleSaveNote} className="mb-6">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              placeholder="Add a research note… (what did you find, what's your thesis, what are you still unsure about)"
              className="w-full border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
            />
            {noteError && <p className="text-xs text-red-500 mt-1">{noteError}</p>}
            <div className="flex justify-end mt-1.5">
              <button
                type="submit"
                disabled={noteSaving || !noteText.trim()}
                className="text-sm bg-gray-900 text-white px-3 py-1.5 hover:bg-gray-700 disabled:opacity-40"
              >
                {noteSaving ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </form>

          {/* Journal entries */}
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400">No notes yet. Add your first observation above.</p>
          ) : (
            <div className="space-y-5">
              {entries.map((entry) => (
                <div key={entry.id} className="border-b border-gray-100 pb-5 last:border-0">
                  <p className="text-xs text-gray-400 font-mono mb-1.5">{formatDate(entry.created_at)}</p>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist — right column */}
        <div className="w-72 shrink-0 px-5 py-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Checklist</h2>
            <span className="text-xs text-gray-500">{checkedCount} of 7</span>
          </div>

          {error && (
            <p className="text-xs text-red-500 mb-3">{error}</p>
          )}

          <div className="space-y-4">
            {Object.entries(CRITERIA_GROUPS).map(([group, criteria]) => (
              <div key={group}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">{group}</p>
                <div className="space-y-1.5">
                  {criteria.map((criterion) => {
                    const item = checklist.find((c) => c.criterion === criterion.slug)
                    if (!item) return null
                    return (
                      <label key={criterion.slug} className="flex items-start gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleCriterion(item)}
                          className="mt-0.5 w-3.5 h-3.5 shrink-0 accent-gray-900"
                        />
                        <span className={`text-xs leading-snug ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {criterion.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Graduate button */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={handleGraduate}
              disabled={!canGraduate}
              title={
                company.stage !== 'screening'
                  ? 'Move company to Screening stage first'
                  : !allChecked
                  ? `Check all 7 criteria first (${checkedCount}/7 done)`
                  : undefined
              }
              className="w-full text-xs bg-gray-900 text-white py-2 px-3 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Graduate to Active →
            </button>
            {graduateError && <p className="text-xs text-red-500 mt-1">{graduateError}</p>}
            {!canGraduate && (
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                {company.stage !== 'screening'
                  ? 'Set stage to Screening to unlock'
                  : `${checkedCount} of 7 criteria checked`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
