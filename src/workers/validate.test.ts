import { describe, it, expect } from 'vitest';
import { validateClause } from './validate';

describe('validate worker', () => {
  it('detects invalid CPF', () => {
    const res = validateClause({ id: '1', title: '', body: 'CPF 123' });
    expect(res.status).toBe('ALERTA');
  });
});
