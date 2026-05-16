import { useState } from 'react'
import CnpjForm from './components/CnpjForm.jsx'
import Summary from './components/Summary.jsx'
import DynamicView from './components/DynamicView.jsx'
import JsonView from './components/JsonView.jsx'
import ActionsBar from './components/ActionsBar.jsx'
import { AlertIcon, SearchIcon } from './components/Icons.jsx'

const DIRECT_URL = 'https://publica.cnpj.ws/cnpj'
const PROXY_URL = '/api/cnpj'

async function fetchCnpj(cnpj) {
  // Tenta primeiro direto (a API tem CORS aberto). Em dev, se falhar, usa o proxy do Vite.
  const tryFetch = async (base) => {
    const r = await fetch(`${base}/${cnpj}`, { headers: { Accept: 'application/json' } })
    return r
  }

  let res
  try {
    res = await tryFetch(DIRECT_URL)
  } catch {
    res = await tryFetch(PROXY_URL)
  }

  if (!res.ok) {
    let body = null
    try {
      body = await res.json()
    } catch {
      /* sem corpo JSON */
    }
    const mensagem =
      body?.detalhes ||
      body?.titulo ||
      (res.status === 404
        ? 'CNPJ não encontrado.'
        : res.status === 429
        ? 'Limite da API público excedido (3 req/min). Tente novamente em alguns segundos.'
        : `Erro ${res.status} ao consultar a API.`)
    throw new Error(mensagem)
  }
  return res.json()
}

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('detail') // 'detail' | 'json'

  async function consultar(cnpj) {
    setLoading(true)
    setError(null)
    try {
      const json = await fetchCnpj(cnpj)
      setData(json)
      setViewMode('detail')
    } catch (e) {
      setError(e.message || 'Falha ao consultar CNPJ.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-900/30">
            <span className="font-bold">C</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Consulta CNPJ
            </h1>
            <p className="text-sm text-slate-400">
              Dados públicos da Receita Federal via publica.cnpj.ws
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur sm:p-6">
        <CnpjForm onSubmit={consultar} loading={loading} />
      </section>

      <main className="mt-8 flex-1 space-y-6">
        {loading && <LoadingState />}

        {error && (
          <div className="fade-in flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            <AlertIcon className="mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Não foi possível consultar</div>
              <div className="text-sm text-red-200/80">{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && !data && <EmptyState />}

        {data && (
          <>
            <Summary data={data} />
            <ActionsBar data={data} viewMode={viewMode} onChangeMode={setViewMode} />
            {viewMode === 'detail' ? <DynamicView data={data} /> : <JsonView data={data} />}
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-slate-500">
        Feito com React + Tailwind · Dados de domínio público
      </footer>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="fade-in space-y-3">
      <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-800/60 text-slate-300">
        <SearchIcon width={22} height={22} />
      </div>
      <p className="text-slate-300">
        Informe um CNPJ acima para visualizar os dados da empresa.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Exemplos: <span className="font-mono">00.000.000/0001-91</span>,{' '}
        <span className="font-mono">33.000.167/0001-01</span>
      </p>
    </div>
  )
}
