import { createClient } from 'redis'

// Synthetic RedisJSON keys the app reads directly via JSON.GET. Shapes mirror
// server/data/dependencyInfoTypes.ts (dependency:info) and the
// "<prefix>:<component>:<env>" -> { v | json, dateAdded } shape read by
// server/services/redisService.readLatest (latest:versions / latest:health).

const url = `redis://${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? '6379'}`

type DependencyReference = { name: string; type: string }

type Dependent = { name: string; isKnownComponent: boolean }

type ComponentDependencyInfo = {
  dependencies: {
    components: string[]
    categories: string[]
    other: DependencyReference[]
  }
  dependents: Dependent[]
}

type EnvDependencyInfo = {
  categoryToComponent: Record<string, string[]>
  componentDependencyInfo: Record<string, ComponentDependencyInfo>
  missingServices: string[]
}

type DependencyInfo = Record<'PROD' | 'PREPROD' | 'DEV', EnvDependencyInfo>

type LatestVersion = { v: string; dateAdded: string }

type LatestHealth = { json: string; dateAdded: string }

// Cross-references the components in the wiremock fixtures so the dependency
// pages render non-empty "depends on" and "relied on by" lists.
const componentDependencyInfo: Record<string, ComponentDependencyInfo> = {
  'hmpps-component-dependencies': {
    dependencies: {
      components: ['accredited-programmes-and-delius'],
      categories: ['helm'],
      other: [],
    },
    dependents: [],
  },
  'hmpps-developer-portal': {
    dependencies: { components: [], categories: ['helm'], other: [] },
    dependents: [{ name: 'accredited-programmes-and-delius', isKnownComponent: true }],
  },
  'accredited-programmes-and-delius': {
    dependencies: { components: ['hmpps-developer-portal'], categories: ['gradle'], other: [] },
    dependents: [{ name: 'hmpps-component-dependencies', isKnownComponent: true }],
  },
}

const envDependencyInfo: EnvDependencyInfo = {
  categoryToComponent: {
    helm: ['hmpps-developer-portal', 'hmpps-component-dependencies'],
    gradle: ['accredited-programmes-and-delius'],
  },
  componentDependencyInfo,
  missingServices: [],
}

const dependencyInfo: DependencyInfo = {
  PROD: envDependencyInfo,
  PREPROD: envDependencyInfo,
  DEV: envDependencyInfo,
}

const components = ['hmpps-developer-portal', 'hmpps-component-dependencies', 'accredited-programmes-and-delius']

const envs = ['dev', 'prod']

// The monitor page marks latest:health entries older than 10 minutes as stale,
// so timestamps are generated per seed() call.
const buildLatest = (): { versions: Record<string, LatestVersion>; health: Record<string, LatestHealth> } => {
  const now = new Date().toISOString()
  const buildDate = now.slice(0, 10)
  const versions: Record<string, LatestVersion> = {}
  const health: Record<string, LatestHealth> = {}

  components.forEach(component => {
    envs.forEach(env => {
      versions[`version:${component}:${env}`] = { v: `${buildDate}.1.abcdef0`, dateAdded: now }
      health[`health:${component}:${env}`] = { json: '{"status":"UP"}', dateAdded: now }
    })
  })

  return { versions, health }
}

const seed = async (): Promise<null> => {
  const client = createClient({ url })
  client.on('error', error => {
    // eslint-disable-next-line no-console
    console.error('Redis client error:', error)
  })

  await client.connect()

  const { versions, health } = buildLatest()

  await client.json.set('dependency:info', '$', dependencyInfo)
  await client.json.set('latest:versions', '$', versions)
  await client.json.set('latest:health', '$', health)
  await client.quit()

  return null
}

// Overwrites a single latest:health entry so monitor polling picks up a new
// status on its next fetch. The dateAdded is refreshed so the tile is not stale.
const setHealth = async (component: string, env: string, status: string): Promise<null> => {
  const client = createClient({ url })
  client.on('error', error => {
    // eslint-disable-next-line no-console
    console.error('Redis client error:', error)
  })

  await client.connect()

  const health: LatestHealth = { json: `{"status":"${status}"}`, dateAdded: new Date().toISOString() }

  await client.json.set('latest:health', `$["health:${component}:${env}"]`, health)
  await client.quit()

  return null
}

export default {
  seed,
  setHealth,
}
