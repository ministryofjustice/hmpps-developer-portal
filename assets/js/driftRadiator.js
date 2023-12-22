dayjs.extend(window.dayjs_plugin_relativeTime)

const tileLine = (label, value) => `<strong>${label}:</strong><span class="tile-value">${value}</span><br/>`
const tileLink = (title, href) => `<a class="tile-value govuk-link--no-visited-state" href="${href}">${title}</a>`

const getDaysDiff = (thisEnv, otherEnv) => {
  const otherEnvDate = otherEnv.version.date
  const thisEnvDate = thisEnv.version.date

  return parseInt(thisEnv.version.sha === otherEnv.version.sha ? -1 : dayjs(otherEnvDate).diff(thisEnvDate, 'day'), 10)
}

const getIndicatorColour = daysDiff => {
  // Decrease denominator to increase rate of change , increase daysDiff to increase initial jump
  const diffScore = (daysDiff + 6) / 15

  const hue = Math.max(0, (1 - diffScore) * 120).toString(10)
  return `hsl(${hue},50%,50%)`
}

const addComponentIfNotExist = (componentName, viewMode) => {
  const componentRow = $(`#${componentName}-row`)
  if (componentRow.length != 0) {
    return
  }

  const title =
    viewMode === 'list'
      ? `<strong>${componentName}</strong> <a class="govuk-link--no-visited-state radiator-circle-link" href="https://app.circleci.com/pipelines/github/ministryofjustice/${componentName}?branch=main">Circle CI pipeline</a>`
      : `<strong>Deployment Drift Radiator</strong>`

  const html = `<p class="govuk-!-margin-bottom-0 govuk-!-margin-top-4">${title}</p>
  <div id="${componentName}-row" class="radiator-row"></div>`

  $('#drift-radiator').append(html)
}

const addEnvIfNotExist = (componentName, environment) => {
  const envTile = $(`#${environment.id}-tile`)
  if (envTile.length != 0) {
    return
  }

  const html = `<div id="${environment.id}-tile" class="radiator-tile">
  <div id="${environment.id}_indicator" class="radiator-indicator ${
    environment.isDev ? 'dev' : 'awaiting-version'
  }"></div>
  <div id="${environment.id}_name"></div>
  <div id="${environment.id}_details"></div>
</div>`

  $(`#${componentName}-row`).append(html)
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

  updateVersion = ({ componentName, env, devEnv, prodEnv }) => {
    addComponentIfNotExist(componentName, this.viewMode)
    addEnvIfNotExist(componentName, env)

    const envLink = `<a class="govuk-link--no-visited-state" href="/components/${componentName}/environment/${env.name}">${env.name}</a>`
    $(`#${env.id}_name`).html(tileLine(envLink, 'Most recent build deployed'))
    $(`#${env.id}_details`).html(tileLine('Version', env.version.full))

    if (env.id !== devEnv.id && devEnv.version) {
      const devEnvSha = devEnv.version.sha
      const thisEnvSha = env.version.sha
      const daysDiff = getDaysDiff(env, devEnv)

      $(`#${env.id}_indicator`).css('background-color', getIndicatorColour(daysDiff))

      const gitDiffUrl = `https://github.com/ministryofjustice/${env.componentName}/compare/${thisEnvSha}...${devEnvSha}`

      if (devEnvSha !== thisEnvSha) {
        const diffDescription =
          daysDiff > 0 ? `${daysDiff} day${daysDiff !== 1 ? 's' : ''} behind dev` : 'A newer build exists'

        $(`#${env.id}_name`).html(tileLine(envLink, diffDescription))
        $(`#${env.id}_details`).html(`
        ${tileLine('Version', `${env.version.full}`)}
        ${tileLink(
          env.name === prodEnv.name ? 'View unreleased changes in Github' : 'View difference to dev in GitHub',
          gitDiffUrl,
        )}
    `)
      }
    }
    if (env.id === devEnv.id) {
      const daysDiff = dayjs(new Date()).diff(env.version.date, 'day')
      if (daysDiff > 20) {
        $(`#${env.id}_indicator`).css('background-color', getIndicatorColour(daysDiff))
      }
      const diffDescription = `Last build ${Math.max(0, daysDiff)} day${daysDiff != 1 ? 's' : ''} ago`
      $(`#${devEnv.id}_name`).html(tileLine(envLink, diffDescription))
    }
  }

  fetchMessages = async queryStringOptions => {
    const queryString = new URLSearchParams(queryStringOptions).toString()
    const streamJson = await this.post('/drift-radiator/queue', { streams: this.lastIds })
    try {
      streamJson.forEach(({ name, messages }) => {
        const streamName = name.split(':')
        const {
          id,
          message: { v: version },
        } = messages[messages.length - 1]
        this.lastIds[streamName] = id

        const [date, build, sha] = version.split('.')
        const envId = streamName.slice(streamName.length - 2).join('_')
        const componentName = streamName[1]
        const thisEnv = this.envs[envId]
        thisEnv.version = { full: version, date, build, sha }

        this.updateVersion({
          componentName,
          env: thisEnv,
          devEnv: this.envs[thisEnv.devEnvId],
          prodEnv: this.envs[thisEnv.prodEnvId],
        })
      })
    } catch (e) {
      console.error(e)
    }
  }

  start = async componentNames => {
    const components = await this.post('/drift-radiator/components.json', { componentNames })
    this.lastIds = Object.fromEntries(components.flatMap(c => c.environments.map(e => [e.streamName, '0'])))
    this.envs = Object.fromEntries(components.flatMap(c => c.environments.map(e => [e.id, e])))

    const update = async () => {
      await this.fetchMessages(this.lastIds)
      setTimeout(update, 10000)
    }
    update()
  }
}
