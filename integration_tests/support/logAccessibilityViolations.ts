import type { Result } from 'axe-core'

const logAccessibilityViolations = (violations: Result[]): void => {
  // eslint-disable-next-line no-console
  console.log(`\n${violations.length} accessibility violation(s) detected`)

  const violationData = violations.map(({ id, impact, description, nodes }) => ({
    id,
    impact,
    description,
    nodes: nodes.length,
    elements: nodes.map(n => n.html).join(' --next element-- '),
  }))

  // eslint-disable-next-line no-console
  console.table(violationData)
}

export default logAccessibilityViolations
