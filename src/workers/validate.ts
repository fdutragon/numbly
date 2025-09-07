export interface ClauseInput { id: string; body: string; title: string }

export function validateClause(c: ClauseInput) {
  const issues: string[] = [];
  if (/\bCPF\b/.test(c.body) && !/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(c.body)) issues.push('CPF inválido no texto');
  if (/\bCNPJ\b/.test(c.body) && !/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/.test(c.body)) issues.push('CNPJ possivelmente inválido');
  if (/\bdata\b/i.test(c.body) && !/\b\d{2}\/\d{2}\/\d{4}\b/.test(c.body)) issues.push('Data sem formato DD/MM/AAAA');
  return { id: c.id, status: issues.length ? 'ALERTA' : 'OK', issues };
}

self.onmessage = (e: MessageEvent) => {
  const { clauses } = e.data as { clauses: ClauseInput[] };
  const results = clauses.map((c) => validateClause(c));
  (self as unknown as { postMessage: (data: unknown) => void }).postMessage(results);
};
