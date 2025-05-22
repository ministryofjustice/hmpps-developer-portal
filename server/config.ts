const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: AgentConfig
}

export default {
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  productId: get('PRODUCT_ID', 'MISSING', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  branchName: get('GIT_BRANCH', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  https: production,
  staticResourceCacheDuration: '1h',
  redis: {
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tlsEnabled: get('REDIS_TLS_ENABLED', 'false'),
    tlsVerification: get('REDIS_TLS_VERIFICATION', 'true'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  apis: {
    serviceCatalogue: {
      url: get('SERVICE_CATALOGUE_URL', 'http://localhost:3000', requiredInProduction),
      timeout: {
        response: Number(get('SERVICE_CATALOGUE_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('SERVICE_CATALOGUE_TIMEOUT_DEADLINE', 5000)),
      },
      healthPath: '/',
      agent: new AgentConfig(Number(get('SERVICE_CATALOGUE_TIMEOUT_RESPONSE', 5000))),
      token: get('SERVICE_CATALOGUE_TOKEN', 'service-catalog-token', requiredInProduction),
    },
    alertManager: {
      url: get('ALERTMANAGER_URL', 'http://localhost:8080/alertmanager', requiredInProduction),
      timeout: {
        response: Number(get('ALERTMANAGER_TIMEOUT_RESPONSE', 1000)),
        deadline: Number(get('ALERTMANAGER_TIMEOUT_DEADLINE', 2500)),
      },
      healthPath: '/-/healthy',
      retries: 1,
      agent: new AgentConfig(Number(get('ALERTMANAGER_TIMEOUT_RESPONSE', 1000))),
    },
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
}
