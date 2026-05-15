import { useState, useMemo } from 'react'
import { humanizeKey, smartFormat } from '../utils/format.js'
import { ChevronIcon } from './Icons.jsx'

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isPrimitive(v) {
  return v === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof v)
}

function Empty() {
  return <span className="text-slate-500">—</span>
}

function PrimitiveValue({ keyName, value }) {
  if (value === null || value === undefined || value === '') return <Empty />

  const k = String(keyName || '').toLowerCase()

  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
          value
            ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
            : 'bg-slate-500/15 text-slate-400 ring-slate-500/30'
        }`}
      >
        {value ? 'Sim' : 'Não'}
      </span>
    )
  }

  if (k === 'email' && typeof value === 'string' && value.includes('@')) {
    return (
      <a
        href={`mailto:${value}`}
        className="text-indigo-300 hover:text-indigo-200 hover:underline break-all"
      >
        {value}
      </a>
    )
  }

  const formatted = smartFormat(keyName, value)
  const looksMono =
    k === 'cnpj' ||
    k === 'cnpj_raiz' ||
    k.endsWith('_cnpj') ||
    k === 'cpf' ||
    k.endsWith('_cpf') ||
    k === 'cep' ||
    k.endsWith('_cep') ||
    k === 'id' ||
    k.endsWith('_id')

  return (
    <span className={`text-slate-100 break-words ${looksMono ? 'font-mono text-[13px]' : ''}`}>
      {formatted}
    </span>
  )
}

// Tabela para arrays de objetos com chaves similares
function ObjectArrayTable({ items, parentKey }) {
  const allKeys = useMemo(() => {
    const set = new Set()
    items.forEach((it) => {
      if (isPlainObject(it)) Object.keys(it).forEach((k) => set.add(k))
    })
    return Array.from(set)
  }, [items])

  // Heurística: mostrar como tabela apenas se todos os valores forem primitivos
  const allPrimitive = items.every(
    (it) =>
      isPlainObject(it) && Object.values(it).every((v) => isPrimitive(v) || v === undefined),
  )

  if (!allPrimitive) {
    return (
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-white/5 bg-slate-900/40 p-3">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
              #{i + 1}
            </div>
            <DynamicNode value={it} parentKey={parentKey} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/5">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/60 text-left">
          <tr>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              #
            </th>
            {allKeys.map((k) => (
              <th
                key={k}
                className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                {humanizeKey(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((it, i) => (
            <tr key={i} className="hover:bg-white/[0.03]">
              <td className="px-3 py-2 text-slate-500">{i + 1}</td>
              {allKeys.map((k) => (
                <td key={k} className="px-3 py-2 align-top">
                  <PrimitiveValue keyName={k} value={it?.[k]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PrimitiveArrayList({ items, parentKey }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((v, i) => (
        <li
          key={i}
          className="rounded-md border border-white/10 bg-slate-900/40 px-2 py-1 text-xs"
        >
          <PrimitiveValue keyName={parentKey} value={v} />
        </li>
      ))}
    </ul>
  )
}

function DynamicNode({ value, parentKey }) {
  if (isPrimitive(value)) {
    return <PrimitiveValue keyName={parentKey} value={value} />
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <Empty />
    if (value.every(isPrimitive)) return <PrimitiveArrayList items={value} parentKey={parentKey} />
    if (value.every(isPlainObject)) return <ObjectArrayTable items={value} parentKey={parentKey} />
    // mistura: cair em lista genérica
    return (
      <div className="space-y-2">
        {value.map((v, i) => (
          <div key={i} className="rounded-lg border border-white/5 bg-slate-900/40 p-3">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">
              #{i + 1}
            </div>
            <DynamicNode value={v} parentKey={parentKey} />
          </div>
        ))}
      </div>
    )
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) return <Empty />
    return (
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <KeyValueRow key={k} keyName={k} value={v} />
        ))}
      </dl>
    )
  }

  return <span className="text-slate-500">{String(value)}</span>
}

function KeyValueRow({ keyName, value }) {
  const nested = isPlainObject(value) || (Array.isArray(value) && value.length > 0)
  if (nested) {
    return (
      <div className="sm:col-span-2 rounded-xl border border-white/5 bg-slate-900/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {humanizeKey(keyName)}
          </div>
          {Array.isArray(value) && (
            <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-300">
              {value.length} {value.length === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>
        <DynamicNode value={value} parentKey={keyName} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wider text-slate-500">
        {humanizeKey(keyName)}
      </dt>
      <dd>
        <PrimitiveValue keyName={keyName} value={value} />
      </dd>
    </div>
  )
}

function Section({ keyName, value, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const isArr = Array.isArray(value)
  const count = isArr ? value.length : isPlainObject(value) ? Object.keys(value).length : null

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2">
          <ChevronIcon open={open} />
          <span className="font-semibold text-slate-100">{humanizeKey(keyName)}</span>
          {count !== null && (
            <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-300">
              {count} {isArr ? (count === 1 ? 'item' : 'itens') : 'campos'}
            </span>
          )}
        </div>
      </button>
      {open && (
        <div className="border-t border-white/5 px-4 py-4">
          <DynamicNode value={value} parentKey={keyName} />
        </div>
      )}
    </div>
  )
}

export default function DynamicView({ data }) {
  if (!data) return null
  const entries = Object.entries(data)

  // Separa em "campos simples" (primitivos no topo) e "seções" (objetos/arrays)
  const primitives = entries.filter(([, v]) => isPrimitive(v))
  const complex = entries.filter(([, v]) => !isPrimitive(v))

  return (
    <div className="fade-in space-y-4">
      {primitives.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Campos gerais
          </h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {primitives.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wider text-slate-500">
                  {humanizeKey(k)}
                </dt>
                <dd>
                  <PrimitiveValue keyName={k} value={v} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {complex.map(([k, v]) => (
        <Section
          key={k}
          keyName={k}
          value={v}
          defaultOpen={!Array.isArray(v) || v.length <= 5}
        />
      ))}
    </div>
  )
}
