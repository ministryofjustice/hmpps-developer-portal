import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { isValidDropDown } from '../utils/utils'

export default function routes({ teamHealthService, componentNameService, dataFilterService }: Services): Router {
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
    if (req.query.updateCustomComponentView === '' && isValidDropDown(req, 'customComponentView')) {
      return res.redirect(`/drift-radiator/custom-components/${req.query.customComponentView}`)
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

  post('/components.json', async (req, res) => {
    const { componentNames } = req.body as Record<string, string[]>
    const driftData = await teamHealthService.getDriftData(componentNames)
    return res.send(driftData)
  })

  return router
}
