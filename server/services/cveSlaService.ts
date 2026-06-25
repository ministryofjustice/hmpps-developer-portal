import assert from 'assert'
import ServiceCatalogueService from './serviceCatalogueService'
import { Component, SnykVulnerability } from '../data/modelTypes'
import { Product } from '../data/strapiApiTypes'
import { relativeTimeFromNow } from '../utils/utils'

export type ComponentInfo = ReturnType<CveSlaService['getComponentInfo']>
export type ProductInfo = {
  name: string
  slug: string
  components: ComponentInfo[]
  numberOfBreachedComponents: number
}

export type Vulnerability = {
  vulnerabilityId: string
  severityLevel: string
  publishedDate: string
  slaBreached: boolean
}

export default class CveSlaService {
  THRESHOLD_DAYS = 7

  constructor(private readonly serviceCatalogueService: ServiceCatalogueService) {}

  async getCveSlaForProduct(serviceAreaSlug: string, productSlug: string) {
    const serviceArea = await this.getCveSlaForServiceArea(serviceAreaSlug)

    const productInfo = serviceArea.productsWithComponents.find(product => product.slug === productSlug)
    assert(productInfo !== undefined, `Product: ${productSlug} does not exist in service area: ${serviceAreaSlug}`)

    return {
      serviceArea: { name: serviceArea.name, slug: serviceArea.slug },
      product: productInfo,
    }
  }

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
      .map(product => this.getProductInfo(product, vulnLookup))
      .sort(this.compareProducts)

    return {
      name: serviceArea.name,
      slug: serviceArea.slug,
      productsWithComponents: products?.filter(product => product.components.length),
      numberOfBreachedProducts: products?.filter(product => product.numberOfBreachedComponents > 0).length,
      numberOfBreachedVulnerabilities: products?.reduce(
        (total, product) => total + product.numberOfBreachedVulnerabilities,
        0,
      ),
    }
  }

  private getProductInfo(product: Product, vulnLookup: Record<string, SnykVulnerability>) {
    const components = product.components
      .map(component => this.getComponentInfo(component, vulnLookup))
      .sort(this.compareComponents)

    return {
      name: product.name,
      slug: product.slug,
      components,
      numberOfBreachedComponents: components.filter(component => component.breachedVulnerabilities.length).length,
      numberOfBreachedVulnerabilities: components.reduce(
        (total, component) => total + component.breachedVulnerabilities.length,
        0,
      ),
    }
  }

  private getComponentInfo(component: Component, vulnLookup: Record<string, SnykVulnerability>) {
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
            breachedSince: vuln.published_date ? relativeTimeFromNow(new Date(vuln.published_date)) : 'n/a',
            slaBreached: this.slaBreached(vuln.published_date),
          }
        })
        .sort(this.compareVulnerabilities)
        ?.filter(vuln => ['HIGH', 'CRITICAL'].includes(vuln.severityLevel)) || []

    return {
      name: component.name,
      scanName: productionEnv?.name,
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
    return result !== 0 ? result : component1.name.localeCompare(component2.name)
  }

  compareProducts(product1: ProductInfo, product2: ProductInfo) {
    const result = product2.numberOfBreachedComponents - product1.numberOfBreachedComponents
    return result !== 0 ? result : product1.name.localeCompare(product2.name)
  }

  compareVulnerabilities(vuln1: Vulnerability, vuln2: Vulnerability) {
    const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const severityComparison = severityOrder.indexOf(vuln2.severityLevel) - severityOrder.indexOf(vuln1.severityLevel)
    if (severityComparison !== 0) return severityComparison
    const dateComparison = new Date(vuln1.publishedDate).getTime() - new Date(vuln2.publishedDate).getTime()
    if (dateComparison !== 0) return dateComparison
    return vuln1.vulnerabilityId.localeCompare(vuln2.vulnerabilityId)
  }
}
