import { SingleResponse, Unwrapped } from '../data/strapiApiTypes'
import { unwrapAttributes } from './strapi4Utils'

test('check unwrapping simple single response', () => {
  type TestType = {
    name: string
    age: number
  }

  const testSingle: SingleResponse<TestType> = {
    data: {
      id: 1,
      attributes: {
        age: 34,
        name: 'Test User',
      },
    },
  }

  const expected: Unwrapped<TestType> = {
    id: 1,
    age: 34,
    name: 'Test User',
  }

  expect(unwrapAttributes(testSingle.data)).toStrictEqual(expected)
})

test('check unwrapping a type with a nested single response', () => {
  type TestType = {
    name: string
    age: number
    nestedSimpleType: SingleResponse<TestType>
  }

  const testSingle: SingleResponse<TestType> = {
    data: {
      id: 1,
      attributes: {
        age: 34,
        name: 'Test User',
        nestedSimpleType: {
          data: {
            id: 12,
            attributes: {
              age: 32,
              name: 'Test User 2',
              nestedSimpleType: undefined,
            },
          },
        },
      },
    },
  }

  const expected: Unwrapped<TestType> = {
    id: 1,
    age: 34,
    name: 'Test User',
    nestedSimpleType: {
      id: 12,
      age: 32,
      name: 'Test User 2',
      nestedSimpleType: undefined,
    },
  }

  expect(unwrapAttributes(testSingle.data)).toStrictEqual(expected)
})
