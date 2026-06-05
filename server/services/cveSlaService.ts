import assert from 'assert'
import ServiceCatalogueService from './serviceCatalogueService'
import { Component, SnykVulnerability } from '../data/modelTypes'

export type ComponentInfo = ReturnType<CveSlaService['getProductionCves']>
export type ProductInfo = { productName: string; components: ComponentInfo[]; breachedComponents: ComponentInfo[] }

export default class CveSlaService {
  THRESHOLD_DAYS = 7

  constructor(private readonly serviceCatalogueService: ServiceCatalogueService) {}

  async getCveSlaForServiceArea(serviceAreaSlug: string) {
    const serviceArea = await this.serviceCatalogueService.getServiceArea({
      serviceAreaSlug,
      withProducts: true,
      withSnykScan: true,
    })
    assert(!Array.isArray(serviceArea) || serviceArea.length, `Service area does not exist: ${serviceAreaSlug}`)

    const snykVulns = await this.serviceCatalogueService.getSnykVulnerabilities()
    const vulnLookup = Object.fromEntries(snykVulns.map(vuln => [vuln.snyk_id, vuln]))

    const products = serviceArea.products
      .map(product => {
        const components = product.components
          .map(component => this.getProductionCves(component, vulnLookup))
          .sort(this.compareComponents)

        return {
          productName: product.name,
          components,
          breachedComponents: components.filter(component => component.breachedVulnerabilities.length),
        }
      })
      .sort(this.compareProducts)

    return {
      serviceArea: serviceArea.name,
      productsWithComponents: products?.filter(product => product.components.length),
      breachedProducts: products?.filter(product => product.breachedComponents.length),
    }
  }

  private getProductionCves(component: Component, vulnLookup: Record<string, SnykVulnerability>) {
    const productionEnv = component.envs.find(env => env.name.toLowerCase().startsWith('prod'))
    const vulnerabilities =
      (productionEnv?.snyk_scan?.snyk_ids as string[])
        ?.map(id => {
          const vuln = vulnLookup[id]
          assert(vuln, `Vulnerability with Snyk ID ${id} not found in lookup`)
          assert(
            ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(vuln.severity.toUpperCase()),
            `Unexpected severity level: ${vuln.severity}`,
          )
          return {
            vulnerabilityId: vuln.snyk_id,
            severityLevel: vuln.severity.toUpperCase(),
            publishedDate: vuln.published_date,
            slaBreached: this.slaBreached(vuln.published_date),
          }
        })
        ?.filter(vuln => ['HIGH', 'CRITICAL'].includes(vuln.severityLevel)) || []

    return {
      componentName: component.name,
      vulnerabilities,
      breachedVulnerabilities: vulnerabilities.filter(vuln => vuln.slaBreached),
    }
  }

  slaBreached(publishedDate: string) {
    const now = new Date()
    const published = new Date(publishedDate)
    const diffInDays = (now.getTime() - published.getTime()) / (1000 * 3600 * 24)
    return diffInDays > this.THRESHOLD_DAYS
  }

  compareComponents(component1: ComponentInfo, component2: ComponentInfo) {
    const result = component2.breachedVulnerabilities.length - component1.breachedVulnerabilities.length
    return result !== 0 ? result : component1.componentName.localeCompare(component2.componentName)
  }

  compareProducts(product1: ProductInfo, product2: ProductInfo) {
    const result = product2.breachedComponents.length - product1.breachedComponents.length
    return result !== 0 ? result : product1.productName.localeCompare(product2.productName)
  }
}
