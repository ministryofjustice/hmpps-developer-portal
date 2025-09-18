import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util'
import nunjucks from 'nunjucks'
import type { Express } from 'express'
import { inflate } from 'pako'
import { toUint8Array } from 'js-base64'
import type { ApplicationInfo } from '../applicationInfo'

// Provide TextEncoder/TextDecoder in Jest if missing
if (typeof globalThis.TextEncoder === 'undefined') {
  // Cast Node's implementations to DOM lib equivalents
  globalThis.TextEncoder = NodeTextEncoder as unknown as typeof TextEncoder
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = NodeTextDecoder as unknown as typeof TextDecoder
}

describe('nunjucksSetup', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  type NextFn = () => void
  type MockResponse = { locals: Record<string, unknown> }
  type Middleware = (req: unknown, res: MockResponse, next: NextFn) => void
  interface MockApp {
    locals: Record<string, unknown>
    settings: Record<string, unknown>
    set: (key: string, value: unknown) => void
    use: (mw: Middleware) => void
    engine: jest.Mock
    middlewares: Middleware[]
  }

  function createMockApp(): MockApp {
    const middlewares: Middleware[] = []
    const locals: Record<string, unknown> = {}
    const settings: Record<string, unknown> = {}

    return {
      locals,
      settings,
      set: jest.fn((key: string, value: unknown) => {
        settings[key] = value
      }),
      use: jest.fn((mw: Middleware) => {
        middlewares.push(mw)
      }),
      engine: jest.fn(),
      // expose for tests
      middlewares,
    }
  }

  it('configures app locals and dev version middleware when not in production', async () => {
    process.env.NODE_ENV = 'test'
    const app = createMockApp()
    const appInfo = { gitShortHash: 'abcdef' } as unknown as ApplicationInfo

    jest.resetModules()
    const { default: nunjucksSetup } = await import('./nunjucksSetup')
    nunjucksSetup(app as unknown as Express, appInfo)

    expect(app.set).toHaveBeenCalledWith('view engine', 'njk')
    expect(app.locals.asset_path).toBe('/assets/')
    expect(app.locals.applicationName).toBe('Developer Portal')
    expect(app.locals.isDev).toBe(true)

    // Should register a middleware to set res.locals.version on each request
    expect(app.use).toHaveBeenCalledTimes(1)
    const mw = app.middlewares[0]
    const res: MockResponse = { locals: {} }
    let nextCalled = false
    mw({}, res, () => {
      nextCalled = true
    })
    expect(typeof res.locals.version).toBe('string')
    expect(nextCalled).toBe(true)
  })

  it('sets static version from applicationInfo in production and does not add middleware', async () => {
    process.env.NODE_ENV = 'production'
    const app = createMockApp()
    const appInfo = { gitShortHash: 'deadbe' } as unknown as ApplicationInfo

    jest.resetModules()
    const { default: nunjucksSetup } = await import('./nunjucksSetup')
    nunjucksSetup(app as unknown as Express, appInfo)

    expect(app.locals.isDev).toBe(false)
    expect(app.locals.version).toBe('deadbe')
    expect(app.use).not.toHaveBeenCalled()
  })

  describe('registered filters', () => {
    let nj: typeof nunjucks
    beforeEach(async () => {
      // Ensure the environment is configured before each filter test
      const app = createMockApp()
      const appInfo = { gitShortHash: 'abc123' } as unknown as ApplicationInfo
      process.env.NODE_ENV = 'test'
      jest.resetModules()
      const { default: nunjucksSetup } = await import('./nunjucksSetup')
      nunjucksSetup(app as unknown as Express, appInfo)
      // capture the same nunjucks module instance where filters were registered
      const njmod = await import('nunjucks')
      nj = njmod.default
    })

    it('findError returns matching error object with text, or null if not found', () => {
      const tpl = `{{ (errors | findError('fieldA')) | toJson(0) | safe }}|{{ (errors | findError('missing')) | toJson(0) | safe }}`
      const ctx = {
        errors: [
          { field: 'fieldA', message: 'Problem A' },
          { field: 'fieldB', message: 'Problem B' },
        ],
      }
      const out = nj.renderString(tpl, ctx)
      expect(out).toBe('{"text":"Problem A"}|null')
    })

    it('errorSummaryList maps errors to summary entries', () => {
      const tpl = `{{ errors | errorSummaryList | toJson(0) | safe }}`
      const ctx = {
        errors: [
          { field: 'name', message: 'Required' },
          { field: 'age', message: 'Invalid' },
        ],
      }
      const out = nj.renderString(tpl, ctx)
      expect(JSON.parse(out)).toEqual([
        { text: 'Required', href: '#name' },
        { text: 'Invalid', href: '#age' },
      ])
    })

    it('snakeToTitleCase converts snake_case to Title Case', () => {
      const out = nj.renderString(`{{ 'very_high_severity' | snakeToTitleCase }}`, {})
      expect(out).toBe('Very High Severity')
    })

    it('initialiseName applies the name initialisation logic', () => {
      const out = nj.renderString(`{{ 'Robert James' | initialiseName }}`, {})
      expect(out).toBe('R. James')
    })

    it('toSelect builds select items and marks the selected value', () => {
      const tpl = `{{ items | toSelect('id','name', 2) | toJson(0) | safe }}`
      const ctx = {
        items: [
          { id: 1, name: 'One' },
          { id: 2, name: 'Two' },
        ],
      }
      const out = nj.renderString(tpl, ctx)
      expect(JSON.parse(out)).toEqual([
        { text: 'One', value: 1, selected: false },
        { text: 'Two', value: 2, selected: true },
      ])
    })

    it('fixed formats numbers with default precision and handles 0 specially', () => {
      expect(nj.renderString(`{{ 1.234 | fixed }}`, {})).toBe('1.23')
      expect(nj.renderString(`{{ 1.2 | fixed }}`, {})).toBe('1.20')
      // 0 should be returned as-is (not formatted), therefore string "0"
      expect(nj.renderString(`{{ 0 | fixed }}`, {})).toBe('0')
    })

    it('toMonitorName applies formatMonitorName', () => {
      expect(nj.renderString(`{{ 'Monitor Name' | toMonitorName }}`, {})).toBe('monitor-name')
    })

    it('dumpJson wraps JSON in <pre> and is not escaped', () => {
      const out = nj.renderString(`{{ obj | dumpJson }}`, { obj: { a: 1 } })
      expect(out).toBe('<pre>{\n  "a": 1\n}</pre>')
    })

    it('toJson stringifies with optional indentation', () => {
      const compact = nj.renderString(`{{ obj | toJson(0) | safe }}`, { obj: { a: 1 } })
      const pretty = nj.renderString(`{{ obj | toJson(2) | safe }}`, { obj: { a: 1 } })
      expect(compact).toBe('{"a":1}')
      expect(pretty).toBe('{\n  "a": 1\n}')
    })

    it('toMermaidEncodedString encodes a mermaid payload compatible with the live editor', () => {
      const src = { val: 'graph TD; A-->B' }
      const encoded = nj.renderString(`{{ src | toMermaidEncodedString }}`, { src })
      // decode base64 (url-safe) to bytes, then inflate and parse JSON
      const compressed = toUint8Array(encoded)
      const jsonBytes = inflate(compressed)
      const decoded = new TextDecoder().decode(jsonBytes)
      const payload = JSON.parse(decoded)

      expect(payload).toMatchObject({
        code: 'graph TD; A-->B',
        autoSync: true,
        updateDiagram: true,
      })
      expect(typeof payload.mermaid).toBe('string')
    })
  })
})
