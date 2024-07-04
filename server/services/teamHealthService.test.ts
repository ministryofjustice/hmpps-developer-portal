import dayjs from 'dayjs'
import RedisService from './redisService'
import ServiceCatalogueService from './serviceCatalogueService'
import TeamHealthService from './teamHealthService'

jest.mock('./redisService')
jest.mock('./serviceCatalogueService')

describe('teamHealthService', () => {
  const redisService = new RedisService(null) as jest.Mocked<RedisService>
  const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
  const teamHealthService = new TeamHealthService(redisService, serviceCatalogueService)

  describe('getDriftData', () => {
    it('happy path', async () => {
      const now = new Date('2023-02-11')

      redisService.readLatest.mockResolvedValue({
        'some-service:dev': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'some-service:preprod': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'some-service:prod': { v: '2023-01-15.120.abc1230', dateAdded: '2023-02-11' },
      })

      serviceCatalogueService.getComponents.mockResolvedValue([
        {
          attributes: {
            name: 'some-service',
            github_repo: 'some-service-repo',
            environments: [
              { name: 'dev', type: 'dev' },
              { name: 'preprod', type: 'preprod' },
              { name: 'prod', type: 'prod' },
            ],
          },
        },
      ])

      const driftData = await teamHealthService.getDriftData(['some-service'], now)
      expect(driftData).toStrictEqual([
        {
          name: 'some-service',
          repo: 'some-service-repo',
          devEnvSha: 'abc1234',
          prodEnvSha: 'abc1230',
          staleness: { days: 9, description: '9 days', hours: 216, millis: 777600000 },
          drift: { days: 18, description: '18 days', hours: 432, millis: 1555200000 },
          environments: [
            {
              buildDate: dayjs('2023-02-02', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: now,
              name: 'dev',
              sha: 'abc1234',
              type: 'dev',
              version: '2023-02-02.123.abc1234',
            },
            {
              buildDate: dayjs('2023-02-02', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: now,
              name: 'preprod',
              sha: 'abc1234',
              type: 'preprod',
              version: '2023-02-02.123.abc1234',
            },
            {
              buildDate: dayjs('2023-01-15', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: now,
              name: 'prod',
              sha: 'abc1230',
              type: 'prod',
              version: '2023-01-15.120.abc1230',
            },
          ],
        },
      ])
    })

    it('multiple dev envs', async () => {
      const now = new Date('2023-02-11')

      redisService.readLatest.mockResolvedValue({
        'some-service:dev': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'some-service:test1': { v: '2023-02-08.123.abc1235', dateAdded: '2023-02-11' },
        'some-service:preprod': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'some-service:prod': { v: '2023-01-15.120.abc1230', dateAdded: '2023-02-11' },
      })

      serviceCatalogueService.getComponents.mockResolvedValue([
        {
          attributes: {
            name: 'some-service',
            github_repo: 'some-service-repo',
            environments: [
              { name: 'dev', type: 'dev' },
              { name: 'test1', type: 'dev' },
              { name: 'preprod', type: 'preprod' },
              { name: 'prod', type: 'prod' },
            ],
          },
        },
      ])

      const driftData = await teamHealthService.getDriftData(['some-service'], now)
      expect(driftData).toStrictEqual([
        {
          name: 'some-service',
          repo: 'some-service-repo',
          devEnvSha: 'abc1235',
          prodEnvSha: 'abc1230',
          staleness: { days: 3, description: '3 days', hours: 72, millis: 259200000 },
          drift: { days: 24, description: '24 days', hours: 576, millis: 2073600000 },
          environments: [
            {
              buildDate: dayjs('2023-02-02', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: now,
              name: 'dev',
              sha: 'abc1234',
              type: 'dev',
              version: '2023-02-02.123.abc1234',
            },
            {
              buildDate: dayjs('2023-02-08', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: now,
              name: 'test1',
              sha: 'abc1235',
              type: 'dev',
              version: '2023-02-08.123.abc1235',
            },
            {
              buildDate: dayjs('2023-02-02', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: now,
              name: 'preprod',
              sha: 'abc1234',
              type: 'preprod',
              version: '2023-02-02.123.abc1234',
            },
            {
              buildDate: dayjs('2023-01-15', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: now,
              name: 'prod',
              sha: 'abc1230',
              type: 'prod',
              version: '2023-01-15.120.abc1230',
            },
          ],
        },
      ])
    })
  })

  describe('getComponentsWeCannotCalculateHealthFor', () => {
    it('all reasons', async () => {
      redisService.readLatest.mockResolvedValue({
        'some-service:dev': { v: '2023-02-02.123%WAARRRPP', dateAdded: '2023-02-11' },
        'some-service:preprod': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'some-service:prod': { v: '2023-01-15.120.abc1230', dateAdded: '2023-02-11' },
        'another-service:preprod': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'another-service:prod': { v: '2023-01-15.120.abc1230', dateAdded: '2023-02-11' },
      })

      serviceCatalogueService.getComponents.mockResolvedValue([
        {
          attributes: {
            name: 'some-service',
            github_repo: 'some-service-repo',
            environments: [
              { name: 'dev', type: 'dev' },
              { name: 'preprod', type: 'preprod' },
              { name: 'prod', type: 'prod' },
            ],
          },
        },
        {
          attributes: {
            name: 'another-service',
            github_repo: 'another-service-repo',
            environments: [
              { name: 'preprod', type: 'preprod' },
              { name: 'prod', type: 'prod' },
            ],
          },
        },
        {
          attributes: {
            name: 'yet-another-service',
            github_repo: 'yet-another-service-repo',
            api: true,
            environments: [
              { name: 'dev', type: 'dev' },
              { name: 'preprod', type: 'preprod' },
              { name: 'prod', type: 'prod' },
            ],
          },
        },
      ])

      const driftData = await teamHealthService.getComponentsWeCannotCalculateHealthFor()
      expect(driftData).toStrictEqual([
        { component: 'another-service', reason: 'Missing Dev Environment' },
        { component: 'some-service', reason: 'Build Version in correct format: 2023-02-02.123%WAARRRPP' },
        { component: 'yet-another-service', reason: 'Missing version info in redis' },
      ])
    })
  })

  describe('getTeamHealth', () => {
    it('happy path', async () => {
      const now = new Date('2023-02-11')

      redisService.readLatest.mockResolvedValue({
        'some-service:dev': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'some-service:preprod': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'some-service:prod': { v: '2023-01-15.120.abc1230', dateAdded: '2023-02-11' },
      })

      serviceCatalogueService.getComponents.mockResolvedValue([
        {
          attributes: {
            name: 'some-service',
            github_repo: 'some-service-repo',
            environments: [
              { name: 'dev', type: 'dev' },
              { name: 'preprod', type: 'preprod' },
              { name: 'prod', type: 'prod' },
            ],
            product: {
              data: {
                attributes: {
                  name: 'product-1',
                  slug: 'product-1-slug',
                  team: {
                    data: { attributes: { name: 'team-1', slug: 'team-1-slug' } },
                  },
                  service_area: {
                    data: { attributes: { name: 'service-area-1', slug: 'service-area-1-slug' } },
                  },
                },
              },
            },
          },
        },
      ])

      const driftData = await teamHealthService.getTeamHealth(now)
      expect(driftData).toStrictEqual({
        drift: {
          All: {
            numberOfComponents: 1,
            serviceAreaSlug: undefined,
            stats: {
              avg: 18,
              days: [18],
              max: 18,
              maxComponent: {
                drift: { days: 18, description: '18 days', hours: 432, millis: 1555200000 },
                name: 'some-service',
                staleness: { days: 9, description: '9 days', hours: 216, millis: 777600000 },
              },
              median: 18,
            },
            teamSlug: 'all',
          },
          'team-1': {
            numberOfComponents: 1,
            serviceAreaSlug: 'service-area-1-slug',
            stats: {
              avg: 18,
              days: [18],
              max: 18,
              maxComponent: {
                drift: { days: 18, description: '18 days', hours: 432, millis: 1555200000 },
                name: 'some-service',
                staleness: { days: 9, description: '9 days', hours: 216, millis: 777600000 },
              },
              median: 18,
            },
            teamSlug: 'team-1',
          },
        },
        staleness: {
          All: {
            numberOfComponents: 1,
            serviceAreaSlug: undefined,
            stats: {
              avg: 9,
              days: [9],
              max: 9,
              maxComponent: {
                drift: { days: 18, description: '18 days', hours: 432, millis: 1555200000 },
                name: 'some-service',
                staleness: { days: 9, description: '9 days', hours: 216, millis: 777600000 },
              },
              median: 9,
            },
            teamSlug: 'all',
          },
          'team-1': {
            numberOfComponents: 1,
            serviceAreaSlug: 'service-area-1-slug',
            stats: {
              avg: 9,
              days: [9],
              max: 9,
              maxComponent: {
                drift: { days: 18, description: '18 days', hours: 432, millis: 1555200000 },
                name: 'some-service',
                staleness: { days: 9, description: '9 days', hours: 216, millis: 777600000 },
              },
              median: 9,
            },
            teamSlug: 'team-1',
          },
        },
      })
    })
  })
})
