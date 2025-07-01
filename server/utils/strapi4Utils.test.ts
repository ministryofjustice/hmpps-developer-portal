import { SingleResponse } from '../data/strapiApiTypes'
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

  const result = unwrapAttributes(testSingle.data)

  expect(result).toStrictEqual({
    id: 1,
    age: 34,
    name: 'Test User',
  })
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

  const result = unwrapAttributes(testSingle.data)

  expect(result).toStrictEqual({
    id: 1,
    age: 34,
    name: 'Test User',
    nestedSimpleType: {
      // we should change the recursive algorith to remove this nested data part
      data: {
        id: 12,
        age: 32,
        name: 'Test User 2',
        nestedSimpleType: undefined,
      },
    },
  })
})
