import { getResortById, getResorts } from './index';

describe('getResorts', () => {
  it('returns an array', () => {
    const result = getResorts();
    expect(Array.isArray(result)).toBe(true);
  });

  it('each resort has an id and name', () => {
    const resorts = getResorts();
    for (const resort of resorts) {
      expect(typeof resort.id).toBe('number');
      expect(typeof resort.name).toBe('string');
    }
  });
});

describe('getResortById', () => {
  it('returns null for an unknown id', () => {
    expect(getResortById(-1)).toBeNull();
  });

  it('returns the resort for a known id', () => {
    const resorts = getResorts();
    if (resorts.length === 0) return;
    const first = resorts[0];
    expect(getResortById(first.id)).toEqual(first);
  });
});
