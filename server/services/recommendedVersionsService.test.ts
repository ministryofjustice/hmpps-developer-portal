import nock from 'nock'
import RecommendedVersionsService from './recommendedVersionsService'

const HOST = 'https://raw.githubusercontent.com'

describe('RecommendedVersionsService', () => {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    jest.clearAllMocks()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  const repo = 'ministryofjustice/hmpps-template-kotlin'
  const branch = 'main'

  const url = (path: string) => `/${repo}/${branch}/${path}`

  it('returns versions from single versions.yaml file when present', async () => {
    const yaml = [
      'versions:',
      '  helm_dependencies:',
      '    generic_prometheus_alerts: "1.2.3"',
      '    generic_service: "4.5.6"',
      '  gradle:',
      '    hmpps_gradle_spring_boot: "7.8.9"',
      '',
    ].join('\n')

    nock(HOST).get(url('versions.yaml')).reply(200, yaml)

    const svc = new RecommendedVersionsService(repo, branch, -1)
    const result = await svc.getRecommendedVersions()

    expect(result.helm_dependencies.generic_prometheus_alerts).toBe('1.2.3')
    expect(result.helm_dependencies.generic_service).toBe('4.5.6')
    expect(result.gradle.hmpps_gradle_spring_boot).toBe('7.8.9')
    expect(result.metadata.source).toBe('single-file')
  })

  it('falls back to helm values.yaml and gradle libs.versions.toml when single file is missing', async () => {
    nock(HOST).get(url('versions.yaml')).reply(404)
    nock(HOST).get(url('versions.yml')).reply(404)

    const helmValues = ['# some values', 'generic_prometheus_alerts: 2.3.4', 'generic_service: 5.6.7', ''].join('\n')

    const toml = ['[versions]', 'hmpps_gradle_spring_boot = "8.9.10"', ''].join('\n')

    nock(HOST).get(url('helm_deploy/values.yaml')).reply(200, helmValues)
    nock(HOST).get(url('gradle/libs.versions.toml')).reply(200, toml)

    const svc = new RecommendedVersionsService(repo, branch, -1)
    const result = await svc.getRecommendedVersions()

    expect(result.helm_dependencies.generic_prometheus_alerts).toBe('2.3.4')
    expect(result.helm_dependencies.generic_service).toBe('5.6.7')
    expect(result.gradle.hmpps_gradle_spring_boot).toBe('8.9.10')
    expect(['fallback', 'partial']).toContain(result.metadata.source)
  })

  it('returns partial when only some sources are available', async () => {
    nock(HOST).get(url('versions.yaml')).reply(404)
    nock(HOST).get(url('versions.yml')).reply(404)

    const helmValues = ['generic_prometheus_alerts: 3.4.5', 'generic_service: 6.7.8'].join('\n')

    nock(HOST).get(url('helm_deploy/values.yaml')).reply(200, helmValues)
    nock(HOST).get(url('gradle/libs.versions.toml')).reply(404)

    const svc = new RecommendedVersionsService(repo, branch, -1)
    const result = await svc.getRecommendedVersions()

    expect(result.helm_dependencies.generic_prometheus_alerts).toBe('3.4.5')
    expect(result.helm_dependencies.generic_service).toBe('6.7.8')
    expect(result.gradle.hmpps_gradle_spring_boot).toBeUndefined()
    expect(result.metadata.source).toBe('partial')
  })

  it('returns none when no sources are available', async () => {
    nock(HOST).get(url('versions.yaml')).reply(404)
    nock(HOST).get(url('versions.yml')).reply(404)
    nock(HOST).get(url('helm_deploy/values.yaml')).reply(404)
    nock(HOST).get(url('gradle/libs.versions.toml')).reply(404)

    const svc = new RecommendedVersionsService(repo, branch, -1)
    const result = await svc.getRecommendedVersions()

    expect(result.helm_dependencies.generic_prometheus_alerts).toBeUndefined()
    expect(result.helm_dependencies.generic_service).toBeUndefined()
    expect(result.gradle.hmpps_gradle_spring_boot).toBeUndefined()
    expect(result.metadata.source).toBe('none')
  })

  it('caches results for TTL duration', async () => {
    const yaml = [
      'versions:',
      '  helm_dependencies:',
      '    generic_prometheus_alerts: "9.9.9"',
      '    generic_service: "9.9.8"',
      '  gradle:',
      '    hmpps_gradle_spring_boot: "9.9.7"',
      '',
    ].join('\n')

    const ttlMs = 60_000
    nock(HOST).get(url('versions.yaml')).reply(200, yaml)

    const svc = new RecommendedVersionsService(repo, branch, ttlMs)
    const first = await svc.getRecommendedVersions()
    expect(first.gradle.hmpps_gradle_spring_boot).toBe('9.9.7')

    // Second call should hit cache, so no new HTTP requests should be pending
    const second = await svc.getRecommendedVersions()
    expect(second).toEqual(first)
    expect(nock.isDone()).toBe(true) // all expected HTTP calls have been made already
  })
})
