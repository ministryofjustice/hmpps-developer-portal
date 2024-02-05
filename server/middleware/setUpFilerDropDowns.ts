import express, { Router, Request, Response, NextFunction } from 'express'
import { Services } from '../services'

export default function setUpFilterDropDowns({ serviceCatalogueService }: Services): Router {
  const router = express.Router()

  router.use(async (_req: Request, res: Response, next: NextFunction) => {
    const serviceAreas = await serviceCatalogueService.getServiceAreas()
    const serviceAreaList = serviceAreas.map(serviceArea => {
      return {
        value: serviceArea.id,
        text: serviceArea.attributes.name,
        selected: false,
      }
    })
    const teams = await serviceCatalogueService.getTeams()
    const teamList = teams.map(team => {
      return {
        value: team.id,
        text: team.attributes.name,
        selected: false,
      }
    })
    const products = await serviceCatalogueService.getProducts({})
    const productList = products.map(product => {
      return {
        value: product.id,
        text: product.attributes.name,
        selected: false,
      }
    })

    serviceAreaList.unshift({ value: 0, text: '', selected: false })
    teamList.unshift({ value: 0, text: '', selected: false })
    productList.unshift({ value: 0, text: '', selected: false })

    res.locals.dropDowns = {
      serviceAreaList,
      teamList,
      productList,
    }

    next()
  })

  return router
}
