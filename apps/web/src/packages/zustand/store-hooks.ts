import { useShallow } from 'zustand/react/shallow';

/**
 * Shallow-equality selector wrapper. Wrap a multi-field selector with this so a
 * store update only re-renders when one of the selected fields actually
 * changes: `useStore(useAppStoreShallow((s) => ({ a: s.a, b: s.b })))`.
 */
export const useAppStoreShallow = useShallow;
