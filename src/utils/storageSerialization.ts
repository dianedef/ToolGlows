/**
 * Chrome storage accepts plain JSON-compatible data. Vue's nested reactive
 * proxies can otherwise be serialized as index-keyed objects instead of arrays.
 */
export function toPlainStorageValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
