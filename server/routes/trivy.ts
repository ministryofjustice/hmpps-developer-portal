import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { isValidDropDown } from '../utils/utils'

export default function routes({ componentNameService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    if (req.query.updateServiceArea === '' && isValidDropDown(req, 'serviceArea')) {
      return res.redirect(`/trivy/service-areas/${req.query.serviceArea}`)
    }
    if (req.query.updateTeam === '' && isValidDropDown(req, 'team')) {
      return res.redirect(`/trivy/teams/${req.query.team}`)
    }
    if (req.query.updateProduct === '' && isValidDropDown(req, 'product')) {
      return res.redirect(`/trivy/products/${req.query.product}`)
    }
    if (req.query.updateCustomComponentView === '' && isValidDropDown(req, 'customComponentView')) {
      return res.redirect(`/trivy/custom-components/${req.query.customComponentView}`)
    }

    const components = await componentNameService.getAllDeployedComponents()
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName: '',
      serviceAreaName: '',
      customComponentName: '',
      useFormattedName: true,
    })

    return res.render('pages/trivy', {
      title: 'Trivy',
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

    return res.render('pages/trivy', {
      title: `Trivy for ${teamName}`,
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

    return res.render('pages/trivy', {
      title: `Trivy for ${serviceAreaName}`,
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

    return res.render('pages/trivy', {
      title: `Trivy for ${productName}`,
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

    return res.render('pages/trivy', {
      title: `Trivy for ${customComponentName}`,
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  return router
}
