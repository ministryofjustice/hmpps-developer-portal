import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Component } from '../data/strapiApiTypes'
import { isValidDropDown } from '../utils/utils'

export default function routes({
  serviceCatalogueService,
  redisService,
  componentNameService,
  dataFilterService,
}: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    if (req.query.updateServiceArea === '' && isValidDropDown(req, 'serviceArea')) {
      return res.redirect(`/drift-radiator/service-areas/${req.query.serviceArea}`)
    }
    if (req.query.updateTeam === '' && isValidDropDown(req, 'team')) {
      return res.redirect(`/drift-radiator/teams/${req.query.team}`)
    }
    if (req.query.updateProduct === '' && isValidDropDown(req, 'product')) {
      return res.redirect(`/drift-radiator/products/${req.query.product}`)
    }
    if (req.query.updateCustomComponent === '' && isValidDropDown(req, 'customComponent')) {
      return res.redirect(`/drift-radiator/custom-components/${req.query.customComponent}`)
    }

    const components = await componentNameService.getAllDeployedComponents()
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName: '',
      serviceAreaName: '',
      customComponentName: '',
      useFormattedName: true,
    })

    return res.render('pages/driftRadiator', {
      title: 'Deployment Drift Radiator',
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  get('/teams/:teamName', async (req, res) => {
    const { teamName } = req.params
    const components = await componentNameService.getAllDeployedComponentsForTeam(teamName)
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName,
      productName: '',
      serviceAreaName: '',
      customComponentName: '',
      useFormattedName: true,
    })

    return res.render('pages/driftRadiator', {
      title: `Deployment drift radiator for ${teamName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  get('/service-areas/:serviceAreaName', async (req, res) => {
    const { serviceAreaName } = req.params
    const components = await componentNameService.getAllDeployedComponentsForServiceArea(serviceAreaName)
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName: '',
      serviceAreaName,
      customComponentName: '',
      useFormattedName: true,
    })

    return res.render('pages/driftRadiator', {
      title: `Deployment drift radiator for ${serviceAreaName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  get('/products/:productName', async (req, res) => {
    const { productName } = req.params
    const components = await componentNameService.getAllDeployedComponentsForProduct(productName)
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName,
      serviceAreaName: '',
      customComponentName: '',
      useFormattedName: true,
    })

    return res.render('pages/driftRadiator', {
      title: `Deployment drift radiator for ${productName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  get('/custom-components/:customComponentName', async (req, res) => {
    const { customComponentName } = req.params
    const components = await componentNameService.getAllDeployedComponentsForCustomComponents(customComponentName)
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName: '',
      serviceAreaName: '',
      customComponentName,
      useFormattedName: true,
    })

    return res.render('pages/driftRadiator', {
      title: `Deployment drift radiator for ${customComponentName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  const toComponentView = (component: Component) => ({
    name: component.name,
    environments: component.environments.map((env, i) => ({
      id: `${component.name}_${env.name}`,
      name: env.name,
      componentName: component.name,
      streamName: `version:${component.name}:${env.name}`,
      devEnvId: `${component.name}_${component.environments[0].name}`,
      prodEnvId: `${component.name}_${component.environments.at(-1).name}`,
      isDev: i === 0,
    })),
  })

  post('/components.json', async (req, res) => {
    const { componentNames } = req.body as Record<string, string[]>

    const allComponents = await serviceCatalogueService.getComponents()
    const components = allComponents
      .filter(c => componentNames.includes(c.attributes.name))
      .map(c => toComponentView(c.attributes))
    return res.send(components)
  })

  post('/queue', async (req, res) => {
    const streams = Object.keys(req.body?.streams).map(queueName => ({
      key: queueName,
      id: req.body?.streams[queueName],
    }))

    const messages = await redisService.readStream(streams)

    return res.send(messages)
  })

  return router
}
