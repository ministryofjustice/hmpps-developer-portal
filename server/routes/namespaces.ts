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

    const displayNamespace = {
      name: namespace.name,
      pingdom_check: namespace.pingdom_check,
      hmpps_template: namespace.hmpps_template,
      rdsInstances: namespace.rds_instance,
      elasticache_cluster: namespace.elasticache_cluster,
    }

    return res.render('pages/namespace', { namespace: displayNamespace })
  })

  router.get('/:namespaceSlug/rds_instance/:rdsInstance', async (req, res) => {
    const namespaceSlug = getFormattedName(req, 'namespaceSlug')
    const namespace = await serviceCatalogueService.getNamespace({ namespaceSlug })
    const { rdsInstance } = req.params
    const filteredRdsInstance = namespace.rds_instance.find(rds => rds.tf_label === rdsInstance)

    const displayNamespace = {
      name: namespace.name,
      rds_instance: filteredRdsInstance || null,
    }

    return res.render('pages/rdsInstance', { namespace: displayNamespace })
  })

  router.get('/:namespaceSlug/elasticache_cluster/:elastiCache', async (req, res) => {
    const namespaceSlug = getFormattedName(req, 'namespaceSlug')
    const namespace = await serviceCatalogueService.getNamespace({ namespaceSlug })
    const elasticacheCluster = req.params.elastiCache
    const filteredElasticacheCluster = namespace.elasticache_cluster.find(
      elasticache => elasticache.tf_label === elasticacheCluster,
    )

    const displayNamespace = {
      name: namespace.name,
      elasticache_cluster: filteredElasticacheCluster || null,
    }

    return res.render('pages/elastiCacheCluster', { namespace: displayNamespace })
  })

  router.get('/:namespaceSlug/hmpps_template/:tf_template', async (req, res) => {
    const namespaceSlug = getFormattedName(req, 'namespaceSlug')
    const namespace = await serviceCatalogueService.getNamespace({ namespaceSlug })
    const templateLabel = req.params.tf_template
    const filteredTemplate = namespace.hmpps_template?.find(template => template.tf_label === templateLabel)

    const displayNamespace = {
      name: namespace.name,
      hmpps_template: filteredTemplate,
    }
    return res.render('pages/hmppsTemplate', { namespace: displayNamespace })
  })

  router.get('/:namespaceSlug/pingdom_check/:encodedPingdomName', async (req, res) => {
    const namespaceSlug = getFormattedName(req, 'namespaceSlug')
    const namespace = await serviceCatalogueService.getNamespace({ namespaceSlug })
    const { encodedPingdomName } = req.params
    const decodedPingdomName = decodeURIComponent(encodedPingdomName)
    const matchingPingdom = namespace.pingdom_check.find(pingdom => pingdom.name === decodedPingdomName)

    const displayNamespace = {
      name: namespace.name,
      pingdom: matchingPingdom || null,
    }

    return res.render('pages/pingdom', { namespace: displayNamespace })
  })
  return router
}
