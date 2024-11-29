dayjs.extend(window.dayjs_plugin_relativeTime)

const getIndicatorColour = daysDiff => {
  // Decrease denominator to increase rate of change , increase daysDiff to increase initial jump
  const diffScore = (daysDiff + 6) / 15

  const hue = Math.max(0, (1 - diffScore) * 120).toString(10)
  return `hsl(${hue},50%,50%)`
}

class DeploymentRenderer {
  constructor(csrfToken, viewMode) {
    this.csrfToken = csrfToken
    this.viewMode = viewMode
  }

  post = async (url, body) => {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken,
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`There was a problem calling: ${url}`)
    }
    return response.json()
  }

  fetchMessages = async componentNames => {
    const components = await this.post('/drift-radiator/components.json', { componentNames })
    $('#dependencyDriftRows').empty()

    components.forEach(component => {
      const environments = component.environments
        .map(environment => {
          const gitDiffUrl = `https://github.com/ministryofjustice/${component.repo}/compare/${environment.sha}...${component.baseSha}`
          const showDiff = Boolean(component.baseSha) && environment.sha !== component.baseSha
          const diffAnchor = showDiff ? `(<a class="govuk-link--no-visited-state" href="${gitDiffUrl}">diff</a>)` : ''
          return `
        <li>
          <a class="env govuk-link--no-visited-state" href="/components/${component.name}/environment/${environment.name}">
              ${environment.name}${environment.daysSinceUpdated > 0 ? '&#129301' : ''}
              <!-- ${environment.daysSinceUpdated} days since last update --!>
          </a> 
              ${environment.version}
              ${diffAnchor}
        </li>`
        })
        .join('')

      $('#dependencyDriftRows').append(`<tr class= "govuk-table__row">
        <td class="govuk-table__cell"><a href="/components/${component.name}" class="govuk-link--no-visited-state">${component.name}</a></td>
        <td class="govuk-table__cell govuk-table__cell--numeric" data-sort-value="${component.staleness.sortValue}">
          <div id="radiator-${component.name}-staleness" class="radiator-indicator">&nbsp;</div>
          ${component.staleness.description}
        </td>
        <td class="govuk-table__cell govuk-table__cell--numeric" data-sort-value="${component.drift.sortValue}">
          <div id="radiator-${component.name}-drift" class="radiator-indicator">&nbsp;</div>
          ${component.drift.description === 'no difference' && component.prodEnvSha !== component.baseSha ? 'less than 1 day' : component.drift.description}
        </td>
        <td class="govuk-table__cell">
          <div>
            <span class="env">Main:</span> 
            <span class="govuk-!-padding-left-7">${component.latestCommit.date} <span class="govuk-!-padding-left-8">${component.latestCommit.sha}</span></span>
          </div>
          <div class="govuk-!-margin-top-0"">
            Environments:<ul class="govuk-!-margin-top-0">
            ${environments}
            </ul>
          </div>
          </td>
        </tr>`)
      // red after around 30 days
      $(`#radiator-${component.name}-staleness`).css(
        'background-color',
        !component.staleness.present ? 'hsl(180,0%,50%)' : getIndicatorColour(component.staleness.days * 0.3),
      )
      // red after around 10 days
      $(`#radiator-${component.name}-drift`).css(
        'background-color',
        !component.drift.present ? 'hsl(180,0%,50%)' : getIndicatorColour(component.drift.days * 0.8),
      )
    })
  }

  start = async componentNames => {
    await this.fetchMessages(componentNames)
  }
}
