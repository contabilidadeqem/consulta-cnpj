import {
  formatCnpj,
  formatCep,
  formatCurrency,
  formatDate,
  formatPhone,
  humanizeKey,
} from '../utils/format.js'
import {
  BuildingIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  TagIcon,
  HashIcon,
} from './Icons.jsx'

function StatusPill({ status }) {
  const s = String(status || '').toLowerCase()
  const styles =
    s === 'ativa'
      ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
      : s === 'baixada'
      ? 'bg-red-500/15 text-red-300 ring-red-500/30'
      : s === 'suspensa' || s === 'inapta'
      ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
      : 'bg-slate-500/15 text-slate-300 ring-slate-500/30'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || '—'}
    </span>
  )
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur transition hover:bg-white/[0.05]">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Icon />
        {title}
      </div>
      <div className="text-sm text-slate-100">{children}</div>
    </div>
  )
}

function Field({ label, value, mono = false }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-sm text-slate-100 ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-500">—</span>}
      </div>
    </div>
  )
}

export default function Summary({ data }) {
  const est = data?.estabelecimento ?? {}
  const cidade = est?.cidade?.nome
  const uf = est?.estado?.sigla
  const cnae = est?.atividade_principal
  const cnaeSec = est?.atividades_secundarias ?? []
  const tel1 = formatPhone(est?.ddd1, est?.telefone1)
  const tel2 = formatPhone(est?.ddd2, est?.telefone2)
  const ies = est?.inscricoes_estaduais ?? []

  const endereco = [
    [est?.tipo_logradouro, est?.logradouro].filter(Boolean).join(' '),
    est?.numero,
    est?.complemento,
  ]
    .filter(Boolean)
    .join(', ')

  const bairroCepLinha = [est?.bairro, est?.cep ? `CEP ${formatCep(est.cep)}` : null]
    .filter(Boolean)
    .join(' — ')

  return (
    <section className="fade-in space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-indigo-300">
              {data?.porte?.descricao || 'Empresa'}
              {data?.natureza_juridica?.descricao
                ? ` · ${data.natureza_juridica.descricao}`
                : ''}
            </div>
            <h2 className="mt-1 truncate text-2xl font-semibold text-white sm:text-3xl">
              {data?.razao_social || '—'}
            </h2>
            {est?.nome_fantasia && (
              <div className="mt-1 text-slate-300">
                <span className="text-slate-500">Nome fantasia:</span> {est.nome_fantasia}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <span className="font-mono">{formatCnpj(est?.cnpj || data?.cnpj_raiz)}</span>
              <span className="text-slate-600">•</span>
              <span>{est?.tipo || '—'}</span>
              <span className="text-slate-600">•</span>
              <StatusPill status={est?.situacao_cadastral} />
            </div>
          </div>
          {data?.capital_social && (
            <div className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Capital social
              </div>
              <div className="mt-0.5 text-lg font-semibold text-emerald-300">
                {formatCurrency(data.capital_social)}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Início atividade" value={formatDate(est?.data_inicio_atividade)} />
          <Field
            label="Data situação"
            value={formatDate(est?.data_situacao_cadastral)}
          />
          <Field
            label="Motivo situação"
            value={est?.motivo_situacao_cadastral || ''}
          />
          <Field
            label="Sócios"
            value={Array.isArray(data?.socios) ? String(data.socios.length) : ''}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard icon={MapPinIcon} title="Endereço">
          <div className="space-y-1">
            <div>{endereco || <span className="text-slate-500">—</span>}</div>
            {bairroCepLinha && (
              <div className="text-slate-300">{bairroCepLinha}</div>
            )}
            <div className="text-slate-300">
              {[cidade, uf].filter(Boolean).join(' / ') || '—'}
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={TagIcon} title="CNAE Principal">
          {cnae ? (
            <div className="space-y-1">
              <div className="font-mono text-indigo-300">{cnae.id || cnae.subclasse}</div>
              <div>{cnae.descricao}</div>
            </div>
          ) : (
            <span className="text-slate-500">—</span>
          )}
          {cnaeSec.length > 0 && (
            <div className="mt-3 border-t border-white/5 pt-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                Secundárias ({cnaeSec.length})
              </div>
              <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
                {cnaeSec.slice(0, 4).map((c, i) => (
                  <li key={i} className="truncate">
                    <span className="font-mono text-slate-500">{c.id || c.subclasse}</span>{' '}
                    {c.descricao}
                  </li>
                ))}
                {cnaeSec.length > 4 && <li>+ {cnaeSec.length - 4} adicionais</li>}
              </ul>
            </div>
          )}
        </InfoCard>

        <InfoCard icon={PhoneIcon} title="Contato">
          <div className="space-y-1">
            <div>{tel1 || <span className="text-slate-500">Telefone —</span>}</div>
            {tel2 && <div className="text-slate-300">{tel2}</div>}
            <div className="flex items-center gap-1.5 text-slate-300">
              <MailIcon width={14} height={14} />
              {est?.email ? (
                <a
                  href={`mailto:${est.email}`}
                  className="text-indigo-300 hover:text-indigo-200 hover:underline"
                >
                  {est.email}
                </a>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={BuildingIcon} title="Empresa">
          <div className="space-y-2">
            <Field label="Porte" value={data?.porte?.descricao} />
            <Field label="Natureza Jurídica" value={data?.natureza_juridica?.descricao} />
            <Field
              label="Qualif. responsável"
              value={data?.qualificacao_do_responsavel?.descricao}
            />
          </div>
        </InfoCard>

        <InfoCard icon={HashIcon} title={`Inscrições Estaduais (${ies.length})`}>
          {ies.length === 0 ? (
            <span className="text-slate-500">Nenhuma encontrada</span>
          ) : (
            <ul className="space-y-1.5">
              {ies.map((ie, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-slate-900/40 px-2.5 py-1.5"
                >
                  <span className="font-mono text-sm">
                    {ie.inscricao_estadual || '—'}
                  </span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">{ie?.estado?.sigla}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 ring-1 ${
                        ie.ativo
                          ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                          : 'bg-slate-500/15 text-slate-400 ring-slate-500/30'
                      }`}
                    >
                      {ie.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </InfoCard>

        <InfoCard icon={BuildingIcon} title={`Sócios (${data?.socios?.length || 0})`}>
          {!data?.socios?.length ? (
            <span className="text-slate-500">Nenhum sócio listado</span>
          ) : (
            <ul className="space-y-1.5">
              {data.socios.slice(0, 4).map((s, i) => (
                <li key={i} className="truncate">
                  <span className="text-slate-100">{s.nome}</span>
                  {s?.qualificacao_socio?.descricao && (
                    <span className="text-slate-500">
                      {' '}
                      — {humanizeKey(s.qualificacao_socio.descricao)}
                    </span>
                  )}
                </li>
              ))}
              {data.socios.length > 4 && (
                <li className="text-xs text-slate-500">
                  + {data.socios.length - 4} adicionais
                </li>
              )}
            </ul>
          )}
        </InfoCard>
      </div>
    </section>
  )
}
