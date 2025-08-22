import type { Team, Product, Component } from '../data/modelTypes'
import logger from '../../logger'

export interface ChannelRecommendation {
  componentName: string
  environments: {
    dev: string
    preprod: string
    prod: string
  }
  currentChannels?: {
    dev?: string
    preprod?: string
    prod?: string
  }
}

export interface TeamChannelStructure {
  teamName: string
  teamSlug: string
  recommendations: ChannelRecommendation[]
  suggestedChannels: {
    nonProd: string
    prod: string
    prodAlt: string
  }
}

export default class MonitoringChannelService {
  /**
   * Generate monitoring channel recommendations for a team
   */
  generateChannelRecommendations(team: Team): TeamChannelStructure {
    logger.info(`Generating channel recommendations for team: ${team.name}`)

    const teamSlug = this.formatChannelName(team.name)
    const suggestedChannels = {
      nonProd: `#${teamSlug}-alerts-non-prod`,
      prod: `#${teamSlug}-alerts-prod`,
      prodAlt: `#${teamSlug}-alerts`,
    }

    const recommendations: ChannelRecommendation[] = []

    if (team.products && team.products.length > 0) {
      team.products.forEach((product: Product) => {
        if (product.components && product.components.length > 0) {
          product.components.forEach((component: Component) => {
            const componentSlug = this.formatChannelName(component.name)

            recommendations.push({
              componentName: component.name,
              environments: {
                dev: suggestedChannels.nonProd,
                preprod: suggestedChannels.nonProd,
                prod: suggestedChannels.prod,
              },
              currentChannels: this.extractCurrentChannels(component),
            })
          })
        }
      })
    }

    return {
      teamName: team.name,
      teamSlug: team.slug,
      recommendations,
      suggestedChannels,
    }
  }

  /**
   * Format team/component name for channel naming
   */
  private formatChannelName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * Extract current alert channels from component data
   * This simulates common channel patterns teams currently use
   */
  private extractCurrentChannels(component: Component): { dev?: string; preprod?: string; prod?: string } {
    // Placeholder logic - in a real implementation, this would:
    // 1. Query the alerting system (e.g., AlertManager, PagerDuty)
    // 2. Look up current channel configurations
    // 3. Map them to environments

    const currentChannels: { dev?: string; preprod?: string; prod?: string } = {}

    // Simulate common current channel patterns that teams use
    const componentSlug = this.formatChannelName(component.name)
    const hasEnvironments = component.envs && component.envs.length > 0

    if (hasEnvironments) {
      // Simulate different channel patterns teams currently use
      const channelPatterns = [
        // Pattern 1: Old DPS shared channels (what we want to migrate away from)
        {
          dev: '#dps_alerts_non_prod',
          preprod: '#dps_alerts_non_prod',
          prod: '#dps_alerts',
        },
        // Pattern 2: Component-specific but inconsistent naming
        {
          dev: `#${componentSlug}-dev-alerts`,
          preprod: `#${componentSlug}-staging-alerts`,
          prod: `#${componentSlug}-alerts`,
        },
        // Pattern 3: Mixed patterns (some envs configured, others not)
        {
          dev: '#dps_alerts_non_prod',
          preprod: undefined,
          prod: `#${componentSlug}-prod`,
        },
        // Pattern 4: No current channels configured
        {
          dev: undefined,
          preprod: undefined,
          prod: undefined,
        },
      ]

      // Randomly assign a pattern to simulate variety (in real implementation, this would be actual data)
      const patternIndex =
        Math.abs(componentSlug.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % channelPatterns.length
      return channelPatterns[patternIndex]
    }

    return currentChannels
  }

  /**
   * Generate a visual tree structure for display
   */
  generateChannelTree(structure: TeamChannelStructure): string[] {
    const tree: string[] = []

    tree.push(`${structure.teamName}`)

    structure.recommendations.forEach((rec, index) => {
      const isLast = index === structure.recommendations.length - 1
      const prefix = isLast ? '└─' : '├─'

      tree.push(`${prefix} ${rec.componentName}`)

      const envPrefix = isLast ? '   ' : '│  '
      tree.push(`${envPrefix}├─ dev ────→ ${rec.environments.dev}`)
      tree.push(`${envPrefix}├─ preprod → ${rec.environments.preprod}`)
      tree.push(`${envPrefix}└─ prod ───→ ${rec.environments.prod}`)
    })

    return tree
  }
}
