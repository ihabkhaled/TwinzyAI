import { describe, expect, it } from 'vitest';

import { createAppStore } from './create-app-store';

interface CounterState {
  count: number;
  increment: () => void;
}

describe('createAppStore', () => {
  it('creates a typed store whose actions update state', () => {
    const useCounter = createAppStore<CounterState>()((set) => ({
      count: 0,
      increment: (): void => {
        set((state) => ({ count: state.count + 1 }));
      },
    }));

    expect(useCounter.getState().count).toBe(0);
    useCounter.getState().increment();
    expect(useCounter.getState().count).toBe(1);
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const useCounter = createAppStore<CounterState>()((set) => ({
      count: 0,
      increment: (): void => {
        set((state) => ({ count: state.count + 1 }));
      },
    }));

    let notifications = 0;
    const unsubscribe = useCounter.subscribe(() => {
      notifications += 1;
    });

    useCounter.getState().increment();
    expect(notifications).toBe(1);

    unsubscribe();
    useCounter.getState().increment();
    expect(notifications).toBe(1);
  });
});
