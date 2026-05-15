import { useMemo } from 'react'

// Syntax highlighting simples para JSON, sem dependências externas
function highlight(json) {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-emerald-300' // number
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'text-sky-300' : 'text-amber-200'
      } else if (/true|false/.test(match)) {
        cls = 'text-fuchsia-300'
      } else if (/null/.test(match)) {
        cls = 'text-slate-500'
      }
      return `<span class="${cls}">${match}</span>`
    },
  )
}

export default function JsonView({ data }) {
  const html = useMemo(() => highlight(JSON.stringify(data, null, 2)), [data])
  return (
    <div className="fade-in rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur">
      <pre
        className="overflow-auto whitespace-pre text-[12.5px] leading-relaxed font-mono text-slate-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
