import { DataItem, SingleResponse, ListResponse } from '../data/strapiApiTypes'

export const unwrapAttributes = (item: Record<string, unknown>): Record<string, unknown> => {
  if (!item || typeof item !== 'object') return item

  // If the item has attributes, merge them with the id and recursively unwrap
  if ('attributes' in item) {
    const { id, attributes } = item as { id: number; attributes: Record<string, unknown> }
    return { id, ...unwrapAttributes(attributes) }
  }

  // Recursively unwrap any nested objects or arrays
  const unwrappedItem: Record<string, unknown> = { ...item }
  for (const key of Object.keys(unwrappedItem)) {
    unwrappedItem[key] = Array.isArray(unwrappedItem[key])
      ? (unwrappedItem[key] as unknown[]).map(unwrapAttributes)
      : unwrapAttributes(unwrappedItem[key] as Record<string, unknown>)
  }

  return unwrappedItem
}

export function unwrapSingleResponse<T>(response: SingleResponse<T>): T & { id: number } {
  const data =
    Array.isArray(response.data) && response.data.length > 0 ? (response.data[0] as DataItem<T>) : response.data

  return unwrapAttributes(data) as T & { id: number }
}

export function unwrapListResponse<T>(response: ListResponse<T>): Array<T & { id: number }> {
  return response.data.map(({ id, attributes }) => ({ ...attributes, id }))
}
