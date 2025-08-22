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
    nonLive: string
    live: string
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
      nonLive: `#${teamSlug}-alerts-non-live`,
      live: `#${teamSlug}-alerts-live`,
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
                dev: suggestedChannels.nonLive,
                preprod: suggestedChannels.nonLive,
                prod: suggestedChannels.live,
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
   * This is a placeholder - in reality, this would query the alerting system
   */
  private extractCurrentChannels(component: Component): { dev?: string; preprod?: string; prod?: string } {
    // Placeholder logic - in a real implementation, this would:
    // 1. Query the alerting system (e.g., AlertManager, PagerDuty)
    // 2. Look up current channel configurations
    // 3. Map them to environments

    const currentChannels: { dev?: string; preprod?: string; prod?: string } = {}

    // For now, we'll simulate some existing channels based on component environments
    if (component.envs && component.envs.length > 0) {
      component.envs.forEach(env => {
        const envName = env.name.toLowerCase()
        if (envName.includes('dev')) {
          currentChannels.dev = `#existing-${this.formatChannelName(component.name)}-dev`
        } else if (envName.includes('preprod') || envName.includes('staging')) {
          currentChannels.preprod = `#existing-${this.formatChannelName(component.name)}-preprod`
        } else if (envName.includes('prod')) {
          currentChannels.prod = `#existing-${this.formatChannelName(component.name)}-prod`
        }
      })
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
