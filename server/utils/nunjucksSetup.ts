/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import { deflate } from 'pako'
import { fromUint8Array } from 'js-base64'
import { formatMonitorName, initialiseName } from './utils'
import { ApplicationInfo } from '../applicationInfo'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Hmpps Developer Portal (beta)'
  app.locals.isDev = !production

  // Cachebusting version string
  if (production) {
    // Version only changes with new commits
    app.locals.version = applicationInfo.gitShortHash
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()

      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('toJson', (val: unknown, depth = 0) => JSON.stringify(val, null, depth))
  njkEnv.addFilter(
    'toSelect',
    (arr: Record<string, unknown>[], valueKey: string, textKey: string, selectedValue: unknown) =>
      arr.map(item => ({ text: item[textKey], value: item[valueKey], selected: item[valueKey] === selectedValue })),
  )

  njkEnv.addFilter('fixed', (num, length) => (num ? num.toFixed(length || 2) : num))

  njkEnv.addFilter('toMonitorName', (val: string) => formatMonitorName(val))

  njkEnv.addFilter('toMermaidEncodedString', (mermaidSource: Record<string, string>) => {
    const payload = {
      code: mermaidSource.val.trim(),
      mermaid: '{ "theme": "default" }',
      autoSync: true,
      updateDiagram: true,
    }
    const data = new TextEncoder().encode(JSON.stringify(payload))
    const compressed = deflate(data, { level: 9 })
    return fromUint8Array(compressed, true)
  })
}
