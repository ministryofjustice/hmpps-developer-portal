import { Router } from 'express'
import type { Services } from '../services'
import { getFormattedName, utcTimestampToUtcDateTime } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name: 'hmpps-terraform-discovery' })
    return res.render('pages/namespaces', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  router.get('/data', async (req, res) => {
    const namespaces = await serviceCatalogueService.getNamespaces()

    res.send(namespaces)
  })

  router.get('/:namespaceSlug', async (req, res) => {
    const namespaceSlug = getFormattedName(req, 'namespaceSlug')
    const namespace = await serviceCatalogueService.getNamespace({ namespaceSlug })
    const rdsInstances = namespace.rds_instance?.map(rdsInstance => rdsInstance)

    const displayNamespace = {
      name: namespace.name,
      pingdom_check: namespace.pingdom_check,
      hmpps_template: namespace.hmpps_template,
      rdsInstances,
    }
    return res.render('pages/namespace', { namespace: displayNamespace })
  })

  router.get('/:namespaceSlug/templates/:template', async (req, res) => {
    const namespaceSlug = getFormattedName(req, 'namespaceSlug')
    const namespace = await serviceCatalogueService.getNamespace({ namespaceSlug })
    const templateLabel = req.params.template
    const filteredTemplate = namespace.hmpps_template?.find(template => template.tf_label === templateLabel)

    const displayNamespace = {
      name: namespace.name,
      hmpps_template: filteredTemplate,
    }
    return res.render('pages/hmppsApplicationTemplate', { namespace: displayNamespace })
  })

  router.get('/:namespaceSlug/pingdom', async (req, res) => {
    const namespaceSlug = getFormattedName(req, 'namespaceSlug')
    const namespace = await serviceCatalogueService.getNamespace({ namespaceSlug })

    const displayNamespace = {
      name: namespace.name,
      pingdom: namespace.pingdom_check,
    }
    return res.render('pages/pingdom', { namespace: displayNamespace })
  })
  return router
}
