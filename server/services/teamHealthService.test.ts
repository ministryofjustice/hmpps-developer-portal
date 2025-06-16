import dayjs from 'dayjs'
import RedisService from './redisService'
import ServiceCatalogueService from './serviceCatalogueService'
import TeamHealthService from './teamHealthService'
import { Component, DataItem } from '../data/strapiApiTypes'

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
        } as DataItem<Component>,
      ])

      const driftData = await teamHealthService.getDriftData(['some-service'], now)
      expect(driftData).toStrictEqual([
        {
          baseSha: undefined,
          drift: {
            days: 0,
            description: 'not available',
            hours: 0,
            millis: 0,
            present: false,
            sortValue: Number.MIN_SAFE_INTEGER,
          },
          environments: [
            {
              buildDate: dayjs('2023-02-02', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: dayjs('2023-02-11', 'YYYY-MM-DD').toDate(),
              daysSinceUpdated: 0,
              name: 'dev',
              sha: 'abc1234',
              type: 'dev',
              version: '2023-02-02.123.abc1234',
            },
            {
              buildDate: dayjs('2023-02-02', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: dayjs('2023-02-11', 'YYYY-MM-DD').toDate(),
              daysSinceUpdated: 0,
              name: 'preprod',
              sha: 'abc1234',
              type: 'preprod',
              version: '2023-02-02.123.abc1234',
            },
            {
              buildDate: dayjs('2023-01-15', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: dayjs('2023-02-11', 'YYYY-MM-DD').toDate(),
              daysSinceUpdated: 0,
              name: 'prod',
              sha: 'abc1230',
              type: 'prod',
              version: '2023-01-15.120.abc1230',
            },
          ],
          latestCommit: { date: undefined, sha: undefined },
          name: 'some-service',
          prodEnvSha: 'abc1230',
          repo: 'some-service-repo',
          staleness: {
            days: 0,
            description: 'not available',
            hours: 0,
            millis: 0,
            present: false,
            sortValue: Number.MIN_SAFE_INTEGER,
          },
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
            latest_commit: { id: 1, sha: '123456789', date_time: '2023-02-02T01:02:03.000Z' },
            environments: [
              { name: 'dev', type: 'dev' },
              { name: 'test1', type: 'dev' },
              { name: 'preprod', type: 'preprod' },
              { name: 'prod', type: 'prod' },
            ],
          },
        } as DataItem<Component>,
      ])

      const driftData = await teamHealthService.getDriftData(['some-service'], now)
      expect(driftData).toStrictEqual([
        {
          baseSha: '1234567',
          drift: { days: 18, description: '18 days', hours: 432, millis: 1555200000, present: true, sortValue: 18 },
          environments: [
            {
              buildDate: dayjs('2023-02-02', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: dayjs('2023-02-11', 'YYYY-MM-DD').toDate(),
              daysSinceUpdated: 0,
              name: 'dev',
              sha: 'abc1234',
              type: 'dev',
              version: '2023-02-02.123.abc1234',
            },
            {
              buildDate: dayjs('2023-02-08', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: dayjs('2023-02-11', 'YYYY-MM-DD').toDate(),
              daysSinceUpdated: 0,
              name: 'test1',
              sha: 'abc1235',
              type: 'dev',
              version: '2023-02-08.123.abc1235',
            },
            {
              buildDate: dayjs('2023-02-02', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: dayjs('2023-02-11', 'YYYY-MM-DD').toDate(),
              daysSinceUpdated: 0,
              name: 'preprod',
              sha: 'abc1234',
              type: 'preprod',
              version: '2023-02-02.123.abc1234',
            },
            {
              buildDate: dayjs('2023-01-15', 'YYYY-MM-DD').toDate(),
              componentName: 'some-service',
              dateAdded: dayjs('2023-02-11', 'YYYY-MM-DD').toDate(),
              daysSinceUpdated: 0,
              name: 'prod',
              sha: 'abc1230',
              type: 'prod',
              version: '2023-01-15.120.abc1230',
            },
          ],
          latestCommit: { date: '2023-02-02', sha: '1234567' },
          name: 'some-service',
          prodEnvSha: 'abc1230',
          repo: 'some-service-repo',
          staleness: { days: 9, description: '9 days', hours: 216, millis: 777600000, present: true, sortValue: 9 },
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
      ] as DataItem<Component>[])

      const driftData = await teamHealthService.getComponentsWeCannotCalculateHealthFor()
      expect(driftData).toStrictEqual([
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
      ] as DataItem<Component>[])

      const driftData = await teamHealthService.getTeamHealth(now)
      expect(driftData).toStrictEqual({
        drift: {
          All: {
            numberOfComponents: 1,
            serviceAreaSlug: undefined,
            stats: {
              avg: 0,
              days: [0],
              max: 0,
              maxComponent: {
                drift: {
                  days: 0,
                  description: 'not available',
                  hours: 0,
                  millis: 0,
                  present: false,
                  sortValue: Number.MIN_SAFE_INTEGER,
                },
                name: 'some-service',
                staleness: {
                  days: 0,
                  description: 'not available',
                  hours: 0,
                  millis: 0,
                  present: false,
                  sortValue: Number.MIN_SAFE_INTEGER,
                },
              },
              median: 0,
            },
            teamSlug: 'all',
          },
          'team-1': {
            numberOfComponents: 1,
            serviceAreaSlug: 'service-area-1-slug',
            stats: {
              avg: 0,
              days: [0],
              max: 0,
              maxComponent: {
                drift: {
                  days: 0,
                  description: 'not available',
                  hours: 0,
                  millis: 0,
                  present: false,
                  sortValue: Number.MIN_SAFE_INTEGER,
                },
                name: 'some-service',
                staleness: {
                  days: 0,
                  description: 'not available',
                  hours: 0,
                  millis: 0,
                  present: false,
                  sortValue: Number.MIN_SAFE_INTEGER,
                },
              },
              median: 0,
            },
            teamSlug: 'team-1',
          },
        },
        staleness: {
          All: {
            numberOfComponents: 1,
            serviceAreaSlug: undefined,
            stats: {
              avg: 0,
              days: [0],
              max: 0,
              maxComponent: {
                drift: {
                  days: 0,
                  description: 'not available',
                  hours: 0,
                  millis: 0,
                  present: false,
                  sortValue: Number.MIN_SAFE_INTEGER,
                },
                name: 'some-service',
                staleness: {
                  days: 0,
                  description: 'not available',
                  hours: 0,
                  millis: 0,
                  present: false,
                  sortValue: Number.MIN_SAFE_INTEGER,
                },
              },
              median: 0,
            },
            teamSlug: 'all',
          },
          'team-1': {
            numberOfComponents: 1,
            serviceAreaSlug: 'service-area-1-slug',
            stats: {
              avg: 0,
              days: [0],
              max: 0,
              maxComponent: {
                drift: {
                  days: 0,
                  description: 'not available',
                  hours: 0,
                  millis: 0,
                  present: false,
                  sortValue: Number.MIN_SAFE_INTEGER,
                },
                name: 'some-service',
                staleness: {
                  days: 0,
                  description: 'not available',
                  hours: 0,
                  millis: 0,
                  present: false,
                  sortValue: Number.MIN_SAFE_INTEGER,
                },
              },
              median: 0,
            },
            teamSlug: 'team-1',
          },
        },
      })
    })
  })

  describe('getComponentsMissingTeams', () => {
    it('should return components with missing teams', async () => {
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
        {
          attributes: {
            name: 'another-service',
            github_repo: 'another-service-repo',
            environments: [
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
            product: {
              data: {
                attributes: {
                  name: 'product-2',
                  slug: 'product-2-slug',
                  team: {},
                  service_area: {
                    data: { attributes: { name: 'service-area-1', slug: 'service-area-1-slug' } },
                  },
                },
              },
            },
          },
        },
      ] as DataItem<Component>[])

      const driftData = await teamHealthService.getComponentsMissingTeams()
      expect(driftData).toStrictEqual([
        {
          product: 'product-2',
          productSlug: 'product-2-slug',
          component: 'yet-another-service',
        },
      ])
    })
  })
})
