import { DataItem, SingleResponse, ListResponse, Unwrapped } from '../data/strapiApiTypes'

export const unwrapAttributes = <T extends Record<string, unknown>>(item: DataItem<T>): Unwrapped<T> => {
  if (!item || typeof item !== 'object') return item as Unwrapped<T>

  // If the item is a data item, merge them with the id and recursively unwrap
  if ('attributes' in item) {
    const { id, attributes } = item as DataItem<Record<string, unknown>>
    return { id, ...unwrapAttributes(attributes) }
  }
  if ('data' in item) {
    const { data } = item as SingleResponse<Record<string, unknown>>
    return { ...unwrapAttributes(data) } as Unwrapped<T>
  }

  const unwrappedItem: Record<string, unknown> = { ...item }

  // Recursively unwrap any nested objects or arrays
  for (const key of Object.keys(unwrappedItem)) {
    unwrappedItem[key] = Array.isArray(unwrappedItem[key])
      ? (unwrappedItem[key] as unknown[]).map(unwrapAttributes)
      : unwrapAttributes(unwrappedItem[key] as Record<string, unknown>)
  }

  return unwrappedItem as Unwrapped<T>
}

export function unwrapSingleResponse<T extends Record<string, unknown>>(response: SingleResponse<T>): Unwrapped<T> {
  const data =
    Array.isArray(response.data) && response.data.length > 0 ? (response.data[0] as DataItem<T>) : response.data

  return unwrapAttributes<T>(data)
}

export function unwrapListResponse<T>(response: ListResponse<T>): Array<T & { id: number }> {
  return response.data.map(({ id, attributes }) => ({ ...attributes, id }))
}
