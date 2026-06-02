import { assert } from 'console'
import { Component, SnykVulnerability } from '../data/strapiApiTypes'
import ServiceCatalogueService from './serviceCatalogueService'

export default class CveSlaService {
  THRESHOLD_DAYS = 7

  constructor(private readonly serviceCatalogueService: ServiceCatalogueService) {}

  async getCveSlaForServiceArea(serviceAreaSlug: string) {
    const snykVulns = await this.serviceCatalogueService.getSnykVulnerabilities()
    const vulnLookup = snykVulns.reduce(
      (lookup, vuln) => {
        // eslint-disable-next-line no-param-reassign
        lookup[vuln.snyk_id] = vuln
        return lookup
      },
      {} as Record<string, SnykVulnerability>,
    )

    const serviceArea = await this.serviceCatalogueService.getServiceArea({
      serviceAreaSlug,
      withProducts: true,
      withSnykScan: true,
    })

    const products = serviceArea.products.map(product => {
      const components = product.components.map(component => this.getProductionCves(component, vulnLookup))

      return {
        productName: product.name,
        components,
        slaBreached: components.some(component => component.slaBreached),
      }
    })

    return {
      serviceArea: serviceArea.name,
      products,
      slaBreached: products?.some(product => product.slaBreached) || false,
    }
  }

  private getProductionCves(component: Component, vulnLookup: Record<string, SnykVulnerability>) {
    const productionEnv = component.envs.find(env => env.name.toLowerCase().startsWith('prod'))
    const vulnerabilities = (productionEnv?.snyk_scan?.snyk_ids as string[])
      ?.map(id => {
        const vuln = vulnLookup[id]
        assert(vuln, `Vulnerability with Snyk ID ${id} not found in lookup`)
        assert(
          ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(vuln.severity),
          `Unexpected severity level: ${vuln.severity}`,
        )
        return {
          vulnerabilityId: vuln.snyk_id,
          severityLevel: vuln.severity,
          publishedDate: vuln.published_date,
          slaBreached: this.slaBreached(vuln.published_date),
        }
      })
      .filter(vuln => ['HIGH', 'CRITICAL'].includes(vuln.severityLevel))

    return {
      componentName: component.name,
      vulnerabilities,
      slaBreached: vulnerabilities?.some(vuln => vuln.slaBreached) || false,
    }
  }

  slaBreached(publishedDate: string) {
    const now = new Date()
    const published = new Date(publishedDate)
    const diffInDays = (now.getTime() - published.getTime()) / (1000 * 3600 * 24)
    return diffInDays > this.THRESHOLD_DAYS
  }
}
