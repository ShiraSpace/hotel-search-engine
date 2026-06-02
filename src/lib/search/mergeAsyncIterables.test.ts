import { mergeAsyncIterables } from './mergeAsyncIterables';

async function* delayed<T>(items: T[], delayMs: number): AsyncGenerator<T> {
  for (const item of items) {
    await new Promise((r) => setTimeout(r, delayMs));
    yield item;
  }
}

async function* instant<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item;
  }
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iter) {
    results.push(item);
  }
  return results;
}

describe('mergeAsyncIterables', () => {
  it('merges two instant iterables preserving all items', async () => {
    const merged = mergeAsyncIterables([instant([1, 2]), instant([3, 4])]);
    const results = await collect(merged);
    expect(results.sort()).toEqual([1, 2, 3, 4]);
  });

  it('yields items from fast source before slow source', async () => {
    jest.useFakeTimers();
    const fast = delayed(['fast1', 'fast2'], 10);
    const slow = delayed(['slow1'], 100);

    const merged = mergeAsyncIterables([fast, slow]);
    const results: string[] = [];

    const done = collect(merged).then((r) => results.push(...r));
    await jest.runAllTimersAsync();
    await done;

    expect(results.indexOf('fast1')).toBeLessThan(results.indexOf('slow1'));
    jest.useRealTimers();
  });

  it('handles a single iterable', async () => {
    const merged = mergeAsyncIterables([instant([42])]);
    const results = await collect(merged);
    expect(results).toEqual([42]);
  });

  it('handles empty iterables', async () => {
    const merged = mergeAsyncIterables([instant([]), instant([])]);
    const results = await collect(merged);
    expect(results).toEqual([]);
  });
});
