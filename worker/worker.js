/**
 * Cloudflare Worker — proxy para consulta de certidões via InfoSimples.
 *
 * Variáveis de ambiente esperadas (configure como Secrets no painel do Worker):
 *   INFOSIMPLES_TOKEN  → seu token da InfoSimples (obrigatório)
 *   ALLOWED_ORIGIN     → origem permitida pelo CORS, ex.: https://contabilidadeqem.github.io
 *                        (opcional; se vazio, libera "*")
 *
 * Rotas:
 *   GET /certidao/federal/{cnpj}
 *   GET /certidao/estadual/{cnpj}?uf=SP
 *   GET /certidao/fgts/{cnpj}
 *   GET /certidao/todas/{cnpj}?uf=SP        (faz as 3 em paralelo)
 *
 * Resposta normalizada:
 *   {
 *     status: "negativa" | "positiva_efeitos" | "positiva" | "pendente" | "erro",
 *     label: "Texto humano",
 *     numero_controle, data_emissao, validade,
 *     motivo: "...",                 (null quando negativa)
 *     consultado_em: "ISO timestamp",
 *     raw: {...}                     (resposta crua, útil pra debug)
 *   }
 */

// Endpoints da InfoSimples (v2). Ajuste conforme a doc atual deles.
const INFOSIMPLES_BASE = 'https://api.infosimples.com/api/v2/consultas';

const ENDPOINTS = {
  federal: 'receita-federal/pgfn',
  fgts: 'caixa/regularidade',
};

// Mapa UF → endpoint da SEFAZ correspondente. Os mais comuns já mapeados.
// Para os demais, o Worker devolve "não configurado" com instrução clara.
const ENDPOINTS_SEFAZ = {
  AC: 'sefaz/ac/certidao-debitos',
  AL: 'sefaz/al/certidao-debitos',
  AP: 'sefaz/ap/certidao-debitos',
  AM: 'sefaz/am/certidao-debitos',
  BA: 'sefaz/ba/certidao-debitos',
  CE: 'sefaz/ce/certidao-debitos',
  DF: 'sefaz/df/certidao-debitos',
  ES: 'sefaz/es/certidao-debitos',
  GO: 'sefaz/go/certidao-debitos',
  MA: 'sefaz/ma/certidao-debitos',
  MT: 'sefaz/mt/certidao-debitos',
  MS: 'sefaz/ms/certidao-debitos',
  MG: 'sefaz/mg/certidao-debitos',
  PA: 'sefaz/pa/certidao-debitos',
  PB: 'sefaz/pb/certidao-debitos',
  PR: 'sefaz/pr/certidao-debitos',
  PE: 'sefaz/pe/certidao-debitos',
  PI: 'sefaz/pi/certidao-debitos',
  RJ: 'sefaz/rj/certidao-debitos',
  RN: 'sefaz/rn/certidao-debitos',
  RS: 'sefaz/rs/certidao-debitos',
  RO: 'sefaz/ro/certidao-debitos',
  RR: 'sefaz/rr/certidao-debitos',
  SC: 'sefaz/sc/certidao-debitos',
  SP: 'sefaz/sp/certidao-debitos',
  SE: 'sefaz/se/certidao-debitos',
  TO: 'sefaz/to/certidao-debitos',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }), origin);
    }
    if (request.method !== 'GET') {
      return cors(json({ error: 'Método não permitido' }, 405), origin);
    }

    if (!env.INFOSIMPLES_TOKEN) {
      return cors(
        json({ status: 'erro', motivo: 'INFOSIMPLES_TOKEN não configurado no Worker.' }, 500),
        origin,
      );
    }

    // /certidao/todas/{cnpj}?uf=SP
    let m = /^\/certidao\/todas\/(\d{14})\/?$/.exec(url.pathname);
    if (m) {
      const [, cnpj] = m;
      const uf = (url.searchParams.get('uf') || '').toUpperCase();
      const [federal, estadual, fgts] = await Promise.all([
        consultar('federal', cnpj, uf, env),
        consultar('estadual', cnpj, uf, env),
        consultar('fgts', cnpj, uf, env),
      ]);
      return cors(json({ federal, estadual, fgts }), origin);
    }

    // /certidao/{tipo}/{cnpj}?uf=SP
    m = /^\/certidao\/(federal|estadual|fgts)\/(\d{14})\/?$/.exec(url.pathname);
    if (m) {
      const [, tipo, cnpj] = m;
      const uf = (url.searchParams.get('uf') || '').toUpperCase();
      const result = await consultar(tipo, cnpj, uf, env);
      return cors(json(result), origin);
    }

    return cors(
      json(
        {
          error: 'Rota inválida.',
          rotas_validas: [
            'GET /certidao/federal/{cnpj}',
            'GET /certidao/estadual/{cnpj}?uf=SP',
            'GET /certidao/fgts/{cnpj}',
            'GET /certidao/todas/{cnpj}?uf=SP',
          ],
        },
        404,
      ),
      origin,
    );
  },
};

/* ---------------- helpers ---------------- */

function cors(response, origin) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function consultar(tipo, cnpj, uf, env) {
  let path = null;
  if (tipo === 'estadual') {
    if (!uf) {
      return errored('UF não informada para certidão estadual.');
    }
    path = ENDPOINTS_SEFAZ[uf];
    if (!path) {
      return errored(`SEFAZ do estado "${uf}" não mapeada no Worker.`);
    }
  } else {
    path = ENDPOINTS[tipo];
    if (!path) return errored(`Tipo "${tipo}" não suportado.`);
  }

  const apiUrl = `${INFOSIMPLES_BASE}/${path}`;
  const body = new URLSearchParams({
    cnpj,
    token: env.INFOSIMPLES_TOKEN,
    timeout: '300',
  });

  let response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch (e) {
    return errored(`Falha de rede ao chamar InfoSimples: ${e.message}`);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    return errored(`Resposta inválida da InfoSimples (HTTP ${response.status}).`);
  }

  return normalize(payload);
}

function normalize(payload) {
  const consultado_em = new Date().toISOString();

  if (!payload || typeof payload !== 'object') {
    return errored('Resposta vazia da API.', { consultado_em });
  }
  if (payload.code !== 200) {
    const detalhe =
      Array.isArray(payload.errors) && payload.errors.length
        ? ' ' + payload.errors.join(' ')
        : '';
    const baseMsg = payload.code_message || `Código ${payload.code}.`;
    // Códigos da InfoSimples que indicam instabilidade temporária da origem.
    const temporario = [600, 615, 616, 617, 618, 619, 620].includes(payload.code);
    return {
      status: temporario ? 'pendente' : 'erro',
      label: temporario ? 'Indisponível no momento' : 'Sem certidão',
      numero_controle: null,
      data_emissao: null,
      validade: null,
      motivo:
        (baseMsg + detalhe).trim() +
        (temporario
          ? ' — instabilidade no site de origem; tente novamente em alguns minutos.'
          : ''),
      api_code: payload.code,
      cobrado: payload?.header?.billable === true,
      consultado_em,
      raw: payload,
    };
  }

  const item = (Array.isArray(payload.data) && payload.data[0]) || {};

  const numero_controle =
    item.certidao_codigo ||
    item.crf ||
    item.numero_controle ||
    item.codigo_controle ||
    null;
  const data_emissao =
    item.emissao_data ||
    item.data_emissao ||
    item.validade_inicio_data ||
    item.emissao ||
    null;
  const validade =
    item.validade_data ||
    item.validade_fim_data ||
    item.validade ||
    item.data_validade ||
    item.vencimento ||
    null;
  const mensagem = String(item.mensagem || item.observacao || item.detalhe || '').trim();
  const situacaoTxt = String(
    item.situacao || item.resultado || item.situacao_cadastral || '',
  ).trim();

  let status;
  let label;

  // SEFAZ estaduais expõem um booleano direto
  if (typeof item.conseguiu_emitir_certidao_negativa === 'boolean') {
    if (item.conseguiu_emitir_certidao_negativa) {
      status = 'negativa';
      label = 'Negativa';
    } else {
      status = /efeito.*negativa|positiva com efeito/i.test(mensagem + ' ' + situacaoTxt)
        ? 'positiva_efeitos'
        : 'positiva';
      label = situacaoTxt || 'Positiva / com pendências';
    }
  } else {
    // PGFN e FGTS: classificação pelo texto da situação
    const norm = (situacaoTxt + ' ' + mensagem).toLowerCase();
    if (/positiva.*efeit|efeito.*negativa/i.test(norm)) {
      status = 'positiva_efeitos';
    } else if (/negativa|sem pend|regular|crf v.lid/i.test(norm)) {
      status = 'negativa';
    } else if (/positiva|com pend|irregular|d.bito/i.test(norm)) {
      status = 'positiva';
    } else {
      status = 'pendente';
    }
    label = situacaoTxt || mensagem || '—';
  }

  return {
    status,
    label: label || '—',
    numero_controle,
    data_emissao,
    validade,
    motivo: status === 'negativa' ? null : mensagem || situacaoTxt || label || null,
    consultado_em,
    raw: payload,
  };
}

function errored(motivo, extra = {}) {
  return {
    status: 'erro',
    label: 'Erro na consulta',
    motivo,
    consultado_em: new Date().toISOString(),
    ...extra,
  };
}
