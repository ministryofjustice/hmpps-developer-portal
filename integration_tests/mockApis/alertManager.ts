import { stubFor } from './wiremock'

// Mirrors the fields assets/js/alerts.js reads from each alert row, plus the
// status.state that drives the active-alert / silenced-alert row classes.
type AlertFixture = {
  startsAt: string
  generatorURL: string
  status: { state: 'active' | 'suppressed' }
  labels: {
    alertname: string
    application: string
    environment: string
    namespace: string
    severity: string
    alert_slack_channel?: string
  }
  annotations: { message: string }
}

const ping = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/alertManager/-/healthy',
    },
    response: {
      status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { status: 'UP' },
    },
  })

// The static proxy mapping matches /alertManager/.* at priority 100, so a
// runtime stub (default priority) with the query string ignored takes over.
const alerts = (alertFixtures: AlertFixture[]) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: '/alertManager/alerts',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: alertFixtures,
    },
  })

const buildAlerts = (): AlertFixture[] => [
  {
    startsAt: '2026-07-01T09:00:00.000Z',
    generatorURL: 'https://prometheus.example.gov.uk/alert/1',
    status: { state: 'active' },
    labels: {
      alertname: 'HighCpuUsage',
      application: 'app-alpha',
      environment: 'dev',
      namespace: 'ns-alpha',
      severity: 'warning',
      alert_slack_channel: '#alpha-alerts',
    },
    annotations: { message: 'CPU usage is high' },
  },
  {
    startsAt: '2026-07-02T10:30:00.000Z',
    generatorURL: 'https://prometheus.example.gov.uk/alert/2',
    status: { state: 'active' },
    labels: {
      alertname: 'DiskFull',
      application: 'app-beta',
      environment: 'prod',
      namespace: 'ns-beta',
      severity: 'critical',
    },
    annotations: { message: 'Disk is nearly full' },
  },
  {
    startsAt: '2026-07-03T11:45:00.000Z',
    generatorURL: 'https://prometheus.example.gov.uk/alert/3',
    status: { state: 'suppressed' },
    labels: {
      alertname: 'MemoryLeak',
      application: 'app-gamma',
      environment: 'dev',
      namespace: 'ns-gamma',
      severity: 'info',
      alert_slack_channel: '#gamma-alerts',
    },
    annotations: { message: 'Memory usage climbing' },
  },
]

export default {
  stubPing: ping,
  stubAlerts: alerts,
  buildAlerts,
}
