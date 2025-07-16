export type DataItem<T> = {
  attributes: T
  id?: number
}

export type ListResponse<T> = {
  data: DataItem<T>[]
  meta?: {
    pagination?: {
      page?: number
      pageCount?: number
      pageSize?: number
      total?: number
    }
  }
}

export type SingleResponse<T> = {
  data: DataItem<T>
  meta?: Record<string, never>
}

// Recursive unwrap utility
// prettier-ignore
export type DeepUnwrap<T> =
  T extends ListResponse<infer U> ? Unwrapped<U>[] :
  T extends SingleResponse<infer U> ? Unwrapped<U> :
  T extends Record<string | number | symbol, unknown>? T:
  T;
// prettier-enable

// Transform utility that applies DeepUnwrap to each property
export type Unwrapped<T> = {
  [K in keyof T]: DeepUnwrap<T[K]>
} & { id?: number }
