export const setOwnValue = (
  target: Record<string, unknown>,
  key: string,
  value: unknown,
): void => {
  Object.defineProperty(target, key, {
    configurable: false,
    enumerable: true,
    value,
    writable: false,
  });
};
