import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import RestClient from '../data/restClient'
import { getAlertName, getAlertType } from '../utils/utils'

interface AlertListResponseDataItem {
  annotations?: {
    dashboard_url?: string
    message?: string
    runbook_url?: string
  }
  endsAt?: string
  fingerprint?: string
  receivers?: [
    {
      name?: string
    },
  ]
  startsAt?: string
  status?: {
    inhibitedBy?: Array<string>
    silencedBy?: Array<string>
    state?: string
  }
  updatedAt?: string
  generatorURL?: string
  labels?: {
    alertname?: string
    application?: string
    businessUnit?: string
    clusterName?: string
    environment?: string
    namespace?: string
    productId?: string
    prometheus?: string
    queue_name?: string
    severity?: string
  }
}

type AlertData = {
  alertName: string
  applicationName: string
  environmentName: string
  alertUrl: string
  severityLabel: string
  summary: string
  namespace: string
}

type ListItem = {
  text: string
  selected: boolean
}

export default function routes({ serviceCatalogueService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(['/', '/:alertType/:alertName'], async (req, res) => {
    const alertType = getAlertType(req)
    const alertName = getAlertName(req)

    logger.info(`Request for /alerts/${alertType}/${alertName}`)

    // const alertType = "null"//get all or category
    // const alertName = "null"//get filter name

    return res.render('pages/alerts') // , {
    // applicationNameList,
    // environmentList,
    // namespaceList,
    // severityList,
    // })
  })

  get('/all', async (req, res) => {
    // console.log('req: ', req.params)
    /// const alertType = getAlertType(req)
    // console.log("alertType: ", alertType)
    // const alertName = getAlertName(req)
    // console.log("alertName: ", alertName)
    // let alertList: AlertData[] = []
    const alerts = await getAlertsApi()
    // const dropDownFilters = await getDropDownFilters(alerts)
    // const applicationNameFilter = Array.from(new Set(alerts.map(a => a.labels.alertname)))
    // const environmantFilter = Array.from(new Set(alerts.map(a => a.labels.environment)))
    // const severityFilter = Array.from(new Set(alerts.map(a => a.labels.severity)))

    //   .map(alertname => {
    //     return alerts.find(a => a.labels.alertname === alertname)
    // })

    /*       alerts.forEach(alert => {
          alertList = alertList.concat(
            getAlertData(alert as AlertListResponseDataItem[])
          )
      }) */
    res.json(
      alerts, // ,
      // dropDownFilters
    )
  })

  return router
}

function getAlertsApi(): Promise<AlertListResponseDataItem[]> {
  return fetch('http://localhost:8080/alertmanager/alerts?filter=businessUnit="hmpps"')
    .then(res => res.json())
    .then(res => {
      return res as AlertListResponseDataItem[]
    })
}

// function getDropDownFilters(alerts:AlertListResponseDataItem[]) {
//   const applicationNameList= Array.from(new Set(alerts.map(a => a.labels.application)))
//       .map(application => {
//         return{ type: 'application', text: application, selected: false }
//       })
//     const environmentList = Array.from(new Set(alerts.map(a => a.labels.environment)))
//       .map(environment => {
//         return{ type: 'environment', text: environment, selected: false }
//       })
//     const namespaceList = Array.from(new Set(alerts.map(a => a.labels.namespace)))
//     .map(namespace => {
//       return{ type: 'namespace', text: namespace, selected: false }
//     })
//     const severityList = Array.from(new Set(alerts.map(a => a.labels.severity)))
//       .map(severity => {
//         return{ type: 'severity', text: severity, selected: false }
//       })
//       return [
//         applicationNameList,
//         environmentList,
//         namespaceList,
//         severityList,
//     ]
// }

/* const getAlertData = (
  alert: AlertListResponseDataItem[]
): AlertData[] => {
  console.log("alert: ", alert)
  const alerts: AlertData[] = []

      alerts.push({
        alertName: alert.labels.alertname as string,
        applicationName: alert.labels.application as string,
        environmentName: alert.labels.environment as string,
        alertUrl: alert.annotations.dashboard_url as string,
        severityLabel: alert.labels.severity as string,
        summary: alert.annotations.summary as string,
      })

  return alerts 
} */

/*   function getAlertsApi(): Promise<string> {
    return fetch('http://localhost:8080/alertmanager/alerts?filter=businessUnit="hmpps"')
      .then(
        (res) => {
          if (res) {
            console.log('res: ', res)
          }
        }
        //res => res.json()
      )
      .then(res => {
        return "hello" //res as AlertData[]
   })
  } */
