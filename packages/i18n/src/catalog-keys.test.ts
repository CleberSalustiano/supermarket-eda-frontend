import { collectMessageKeys } from './catalog-keys';

describe('collectMessageKeys', () => {
  const a = { title: 'Oi', nested: { greet: (p: { name: string }) => `Oi ${p.name}`, bye: 'Tchau' } };

  it('returns sorted dot paths and treats functions as leaves', () => {
    expect(collectMessageKeys(a)).toEqual(['nested.bye', 'nested.greet', 'title']);
  });

  it('gives equal key sets for catalogs with equal shape', () => {
    const b = { title: 'Hi', nested: { greet: (p: { name: string }) => `Hi ${p.name}`, bye: 'Bye' } };
    expect(collectMessageKeys(b)).toEqual(collectMessageKeys(a));
  });

  it('exposes a missing key as a difference', () => {
    const b = { title: 'Hi', nested: { bye: 'Bye' } };
    expect(collectMessageKeys(b)).not.toEqual(collectMessageKeys(a));
  });

  it('throws on an empty message', () => {
    expect(() => collectMessageKeys({ nested: { bye: '' } })).toThrow('Empty message at nested.bye');
  });
});
