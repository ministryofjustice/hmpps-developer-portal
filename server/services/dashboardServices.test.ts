import { fetchProductList } from './dashboardServices'

function mockFetchJson(json: unknown, ok = true) {
  const jsonMock = jest.fn().mockResolvedValue(json)
  const fetchMock = jest.fn().mockResolvedValue({
    ok,
    json: jsonMock,
  })
  globalThis.fetch = fetchMock
  return { fetchMock, jsonMock }
}

describe('fetchProductList', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })
  it('returns list of products names', async () => {
    const { fetchMock, jsonMock } = mockFetchJson([{ name: 'prod 1' }, { name: 'prod 2' }])
    const result = await fetchProductList()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(jsonMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual(['prod 1', 'prod 2'])
  })
  it('returns an empty array if response is not ok', async () => {
    const { fetchMock } = mockFetchJson([{ name: 'prod 1' }, { name: 'prod 2' }], false)
    const result = await fetchProductList()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })
  it('returns an empty array if JSON error', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('bad json')),
    })
    expect(await fetchProductList()).toEqual([])
  })
})
