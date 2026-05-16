// Utilitários de formatação para dados retornados pela API publica.cnpj.ws

export function onlyDigits(s) {
  return String(s ?? '').replace(/\D/g, '')
}

export function maskCnpjInput(raw) {
  const d = onlyDigits(raw).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function formatCnpj(v) {
  const d = onlyDigits(v)
  if (d.length !== 14) return String(v ?? '')
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function formatCpf(v) {
  const d = onlyDigits(v)
  if (d.length !== 11) return String(v ?? '')
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function formatCep(v) {
  const d = onlyDigits(v)
  if (d.length !== 8) return String(v ?? '')
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export function formatPhone(ddd, num) {
  const d = onlyDigits(num)
  if (!d) return ''
  const ddPart = ddd ? `(${onlyDigits(ddd)}) ` : ''
  if (d.length === 8) return `${ddPart}${d.slice(0, 4)}-${d.slice(4)}`
  if (d.length === 9) return `${ddPart}${d.slice(0, 5)}-${d.slice(5)}`
  return `${ddPart}${d}`
}

export function formatDate(v) {
  if (v === null || v === undefined || v === '') return ''
  const s = String(v)
  // Aceita "YYYY-MM-DD" e ISO 8601 completo
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(s)
  if (m) {
    const [, y, mo, d, hh, mm] = m
    return hh ? `${d}/${mo}/${y} ${hh}:${mm}` : `${d}/${mo}/${y}`
  }
  return s
}

export function formatCurrency(v) {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(String(v).replace(',', '.'))
  if (Number.isNaN(n)) return String(v)
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function formatBoolean(b) {
  return b ? 'Sim' : 'Não'
}

// Heurística para detectar e formatar valores primitivos com base na chave
export function smartFormat(key, value) {
  if (value === null || value === undefined || value === '') return ''
  const k = String(key || '').toLowerCase()

  if (typeof value === 'boolean') return formatBoolean(value)

  if (k === 'cnpj' || k === 'cnpj_raiz' || k.endsWith('_cnpj')) return formatCnpj(value)
  if (k === 'cpf' || k.endsWith('_cpf')) return formatCpf(value)
  if (k === 'cep' || k.endsWith('_cep')) return formatCep(value)

  if (
    k === 'capital_social' ||
    k.includes('valor') ||
    k.includes('faturamento') ||
    k.includes('receita')
  ) {
    return formatCurrency(value)
  }

  if (
    k.startsWith('data_') ||
    k.endsWith('_em') ||
    k === 'atualizado_em' ||
    k === 'criado_em'
  ) {
    return formatDate(value)
  }

  return String(value)
}

// Conta campos primitivos totais e preenchidos, percorrendo recursivamente
export function countFields(value, counter = { total: 0, filled: 0 }) {
  if (Array.isArray(value)) {
    value.forEach((v) => countFields(v, counter))
  } else if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((v) => countFields(v, counter))
  } else {
    counter.total += 1
    if (value !== null && value !== undefined && value !== '') counter.filled += 1
  }
  return counter
}

// Rótulo amigável para chaves do JSON
export function humanizeKey(key) {
  if (!key) return ''
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bCnpj\b/, 'CNPJ')
    .replace(/\bCpf\b/, 'CPF')
    .replace(/\bCep\b/, 'CEP')
    .replace(/\bDdd\b/, 'DDD')
    .replace(/\bIbge\b/, 'IBGE')
    .replace(/\bUf\b/, 'UF')
    .replace(/\bIso2\b/, 'ISO 2')
    .replace(/\bIso3\b/, 'ISO 3')
}
