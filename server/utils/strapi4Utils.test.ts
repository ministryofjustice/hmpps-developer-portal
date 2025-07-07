import { ListResponse, SingleResponse, Unwrapped } from '../data/strapiApiTypes'
import { unwrapAttributes, unwrapListResponse } from './strapi4Utils'

describe('test unwrapping responses', () => {
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

  test('check unwrapping a type with a nested array response', () => {
    type TestType2 = {
      theName: string
      testList: ListResponse<TestType>
    }
    type TestType = {
      name: string
      age: number
      nestedSimpleType: SingleResponse<TestType2>
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
                theName: 'Test User 2',
                testList: {
                  data: [
                    {
                      id: 21,
                      attributes: {
                        age: 43,
                        name: 'Test User 3',
                        nestedSimpleType: {
                          data: {
                            id: 64,
                            attributes: {
                              theName: 'Test User 4',
                              testList: { data: [] },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
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
        theName: 'Test User 2',
        testList: [
          {
            id: 21,
            age: 43,
            name: 'Test User 3',
            nestedSimpleType: {
              id: 64,
              theName: 'Test User 4',
              testList: [],
            },
          },
        ],
      },
    }

    expect(unwrapAttributes(testSingle.data)).toStrictEqual(expected)
  })

  test('unwrap list response', () => {
    type TestType2 = {
      theName: string
      testList: ListResponse<TestType>
    }
    type TestType = {
      name: string
      age: number
      nestedSimpleType: SingleResponse<TestType2>
    }

    const testSingle: ListResponse<TestType> = {
      data: [
        {
          id: 1,
          attributes: {
            age: 34,
            name: 'Test User',
            nestedSimpleType: {
              data: {
                id: 12,
                attributes: {
                  theName: 'Test User 2',
                  testList: {
                    data: [
                      {
                        id: 21,
                        attributes: {
                          age: 43,
                          name: 'Test User 3',
                          nestedSimpleType: {
                            data: {
                              id: 64,
                              attributes: {
                                theName: 'Test User 4',
                                testList: { data: [] },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ],
    }

    const expected: Unwrapped<TestType>[] = [
      {
        id: 1,
        age: 34,
        name: 'Test User',
        nestedSimpleType: {
          id: 12,
          theName: 'Test User 2',
          testList: [
            {
              id: 21,
              age: 43,
              name: 'Test User 3',
              nestedSimpleType: {
                id: 64,
                theName: 'Test User 4',
                testList: [],
              },
            },
          ],
        },
      },
    ]

    expect(unwrapListResponse(testSingle)).toStrictEqual(expected)
  })

  test('unwrap type response with raw arrays', () => {
    type TestType2 = {
      theName: string
      testList: ListResponse<TestType>
    }
    type TestType = {
      name: string
      age: number
      colours: string[]
      nestedSimpleType: SingleResponse<TestType2>
    }

    const testSingle: ListResponse<TestType> = {
      data: [
        {
          id: 1,
          attributes: {
            age: 34,
            name: 'Test User',
            colours: ['blue'],
            nestedSimpleType: {
              data: {
                id: 12,
                attributes: {
                  theName: 'Test User 2',
                  testList: {
                    data: [
                      {
                        id: 21,
                        attributes: {
                          age: 43,
                          name: 'Test User 3',
                          colours: ['red', 'yellow'],
                          nestedSimpleType: {
                            data: {
                              id: 64,
                              attributes: {
                                theName: 'Test User 4',
                                testList: { data: [] },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ],
    }

    const expected: Unwrapped<TestType>[] = [
      {
        id: 1,
        age: 34,
        name: 'Test User',
        colours: ['blue'],
        nestedSimpleType: {
          id: 12,
          theName: 'Test User 2',
          testList: [
            {
              id: 21,
              age: 43,
              name: 'Test User 3',
              colours: ['red', 'yellow'],
              nestedSimpleType: {
                id: 64,
                theName: 'Test User 4',
                testList: [],
              },
            },
          ],
        },
      },
    ]

    expect(unwrapListResponse(testSingle)).toStrictEqual(expected)
  })

  test('unwrap type response with raw objects', () => {
    type TestType2 = {
      theName: string
      testList: ListResponse<TestType>
    }
    type TestType = {
      name: string
      age: number
      colours: Record<string, number>
      nestedSimpleType: SingleResponse<TestType2>
    }

    const testSingle: ListResponse<TestType> = {
      data: [
        {
          id: 1,
          attributes: {
            age: 34,
            name: 'Test User',
            colours: { blue: 1 },
            nestedSimpleType: {
              data: {
                id: 12,
                attributes: {
                  theName: 'Test User 2',
                  testList: {
                    data: [
                      {
                        id: 21,
                        attributes: {
                          age: 43,
                          name: 'Test User 3',
                          colours: { red: 2, yellow: 3 },
                          nestedSimpleType: {
                            data: {
                              id: 64,
                              attributes: {
                                theName: 'Test User 4',
                                testList: { data: [] },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ],
    }

    const expected: Unwrapped<TestType>[] = [
      {
        id: 1,
        age: 34,
        name: 'Test User',
        colours: { blue: 1 },
        nestedSimpleType: {
          id: 12,
          theName: 'Test User 2',
          testList: [
            {
              id: 21,
              age: 43,
              name: 'Test User 3',
              colours: { red: 2, yellow: 3 },
              nestedSimpleType: {
                id: 64,
                theName: 'Test User 4',
                testList: [],
              },
            },
          ],
        },
      },
    ]
    expect(unwrapListResponse(testSingle)).toStrictEqual(expected)
  })
})
