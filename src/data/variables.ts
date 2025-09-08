export type ContractVariables = {
  partyAName: string;
  partyAId: string; // CPF/CNPJ
  partyBName: string;
  partyBId: string; // CPF/CNPJ
  contractValue: string; // e.g., "R$ 10.000,00"
  city: string;
  state: string;
  startDate: string; // ISO or DD/MM/YYYY (livre)
  endDate: string;   // ISO or DD/MM/YYYY (livre)
  address: string;
};

const STORAGE_KEY = 'numbly:contract:variables';

const DEFAULTS: ContractVariables = {
  partyAName: '',
  partyAId: '',
  partyBName: '',
  partyBId: '',
  contractValue: '',
  city: '',
  state: '',
  startDate: '',
  endDate: '',
  address: '',
};

export function getVariables(): ContractVariables {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed } as ContractVariables;
  } catch {
    return { ...DEFAULTS };
  }
}

export function setVariables(update: Partial<ContractVariables>): ContractVariables {
  const current = getVariables();
  const next = { ...current, ...update } as ContractVariables;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }
  return next;
}




