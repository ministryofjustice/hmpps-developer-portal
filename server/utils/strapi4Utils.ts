import { DataItem, SingleResponse, ListResponse, Unwrapped } from '../data/strapiApiTypes'

type Payload = Record<string, unknown>
type Unwrappable<T extends Payload> = DataItem<T> | SingleResponse<T> | ListResponse<T> | Array<T> | T

export const unwrapAttributes = <T extends Payload>(item: Unwrappable<T>): Unwrapped<T> => {
  if (!item || typeof item !== 'object') return item as Unwrapped<T>

  // If the item is a DataItem, embed id into the result and include all contents unwrapped recursively
  if ('attributes' in item) {
    const { id, attributes } = item as DataItem<T>
    return { id, ...unwrapAttributes(attributes) } as Unwrapped<T>
  }

  // If the item is a SingleResponse, skip 'data' wrapper and recursively unwrap contents
  if ('data' in item) {
    const { data } = item as SingleResponse<T>
    return unwrapAttributes<T>(data)
  }

  // If it's an array, unwrap each item recursively
  if (Array.isArray(item)) {
    return item.map(unwrapAttributes<T>) as unknown as Unwrapped<T>
  }

  // Else it's an object, unwrap each value recursively
  const unwrappedItem: Record<string, unknown> = { ...item }

  for (const key of Object.keys(unwrappedItem)) {
    unwrappedItem[key] = unwrapAttributes<T>(unwrappedItem[key] as Unwrappable<T>)
  }

  return unwrappedItem as Unwrapped<T>
}

export function unwrapSingleResponse<T extends Payload>(response: SingleResponse<T>): Unwrapped<T> {
  const data =
    Array.isArray(response.data) && response.data.length > 0 ? (response.data[0] as DataItem<T>) : response.data

  return unwrapAttributes<T>(data)
}

export function unwrapListResponse<T extends Payload>(response: ListResponse<T>): Unwrapped<T>[] {
  return response.data.map(unwrapAttributes<T>)
}
