import { useCallback, useState } from 'react';

import { DEFAULT_RESULT_COUNT, RESULT_COUNT_OPTIONS } from '../model/game.constants';

/**
 * The small slice of game state that owns the user-selected number of results.
 * Kept separate from {@link useGame} so the orchestrator hook stays under the
 * function length cap and this single concern is easy to test in isolation.
 */
export const useResultCount = (): {
  resultCount: number;
  resultCountOptions: readonly number[];
  onResultCountChange: (count: number) => void;
} => {
  const [resultCount, setResultCount] = useState(DEFAULT_RESULT_COUNT);

  const onResultCountChange = useCallback((count: number): void => {
    setResultCount(count);
  }, []);

  return {
    resultCount,
    resultCountOptions: RESULT_COUNT_OPTIONS,
    onResultCountChange,
  };
};
