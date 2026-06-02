/**
 * Yields values from multiple async iterables concurrently, in arrival order.
 * Think of it as a merge lane: whichever provider emits a value first, that value
 * comes out first — no waiting for slower iterables to finish.
 *
 * Each iterable runs independently. A slow provider doesn't block a fast one.
 */

/**
 * Wraps one async iterator so we can race it against others via Promise.race.
 *
 * The challenge: Promise.race tells you *what* resolved, not *which* promise won.
 * By embedding `slot` inside the resolved value, we always know which iterator
 * produced the result and can immediately queue its next pull.
 */
type IterSlot<T> = {
  iter: AsyncIterator<T>;
  next: Promise<IterResult<T>>; // the in-flight promise for this iterator's next value
};

// Carries either a value + its source slot, or a done signal + its source slot.
type IterResult<T> =
  | { slot: IterSlot<T>; done: true }
  | { slot: IterSlot<T>; done: false; value: T };

/**
 * Pulls the next value from the slot's iterator and stores the resulting promise
 * back on `slot.next`, keeping the slot's promise always current.
 *
 * The resolved value embeds a reference to `slot` so Promise.race winners are
 * self-identifying — we know which iterator to advance next without any lookup.
 */
function advance<T>(slot: IterSlot<T>): void {
  slot.next = slot.iter.next().then((result): IterResult<T> => {
    return result.done
      ? { slot, done: true }
      : { slot, done: false, value: result.value };
  });
}

export async function* mergeAsyncIterables<T>(
  iterables: AsyncIterable<T>[]
): AsyncGenerator<T> {
  if (iterables.length === 0) return;

  // One slot per iterable — each slot holds its iterator and its current in-flight promise.
  const slots: IterSlot<T>[] = iterables.map((iterable) => {
    const slot: IterSlot<T> = {
      iter: iterable[Symbol.asyncIterator](),
      next: null!,
    };
    advance(slot);
    return slot;
  });

  // The race pool: one promise per active iterator.
  const pending = new Set(slots.map((slot) => slot.next));

  while (pending.size > 0) {
    const result = await Promise.race(pending);

    // Delete before advancing — result.slot.next still points to the resolved
    // promise here. After advance() it would point to the new one.
    pending.delete(result.slot.next);

    if (!result.done) {
      yield result.value;
      advance(result.slot); // queue the next pull for the winning iterator
      pending.add(result.slot.next); // re-enter it into the race
    }
    // done === true: iterator exhausted — don't re-add, it falls out of the race
  }
}
