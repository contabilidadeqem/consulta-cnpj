import { useState } from 'react'
import { CodeIcon, GridIcon, CopyIcon, CheckIcon } from './Icons.jsx'
import { countFields } from '../utils/format.js'

export default function ActionsBar({ data, viewMode, onChangeMode }) {
  const [copied, setCopied] = useState(false)
  const { total, filled } = countFields(data)
  const pct = total ? Math.round((filled / total) * 100) : 0

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-300">
          <span className="font-semibold text-white">{filled}</span>
          <span className="text-slate-500"> / {total} campos preenchidos</span>
        </div>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-indigo-400 transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-slate-400">{pct}%</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-xl bg-slate-900/60 p-1 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => onChangeMode('detail')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
              viewMode === 'detail'
                ? 'bg-indigo-500/90 text-white shadow'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <GridIcon width={16} height={16} />
            Visual
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('json')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
              viewMode === 'json'
                ? 'bg-indigo-500/90 text-white shadow'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <CodeIcon width={16} height={16} />
            JSON
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800"
        >
          {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
          {copied ? 'Copiado!' : 'Copiar JSON'}
        </button>
      </div>
    </div>
  )
}
