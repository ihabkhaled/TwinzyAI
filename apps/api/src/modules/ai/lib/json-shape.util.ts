import { isRecord } from '@twinzy/shared';

/** Compare JSON structure while allowing scalar values to change. */
export const hasSameJsonShape = (left: unknown, right: unknown): boolean => {
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => hasSameJsonShape(value, right[index]))
    );
  }
  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) {
      return false;
    }
    const leftKeys = Object.keys(left).toSorted((a, b) => a.localeCompare(b));
    const rightKeys = Object.keys(right).toSorted((a, b) => a.localeCompare(b));
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every(
        (key, index) => key === rightKeys[index] && hasSameJsonShape(left[key], right[key]),
      )
    );
  }
  return typeof left === typeof right;
};
