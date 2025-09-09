import { SingleResponse, ListResponse } from '../data/strapiClientTypes'

type Payload = Record<string, unknown>

export function unwrapSingleResponse<T extends Payload>(response: SingleResponse<T>): T {
  return Array.isArray(response.data) && response.data.length > 0 ? (response.data[0] as T) : response.data
}

export function unwrapListResponse<T extends Payload>(response: ListResponse<T>): T[] {
  return response.data
}
