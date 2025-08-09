export type ListResponse<T> = {
  data: T[]
}

export type SingleResponse<T> = {
  data: T
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
export type Unwrapped<T> = T
