dayjs.extend(window.dayjs_plugin_relativeTime)

const lastIds = Object.fromEntries(components.flatMap(c => c.environments.map(e => [e.streamName, '0'])))
const envs = Object.fromEntries(components.flatMap(c => c.environments.map(e => [e.id, e])))

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

const updateVersion = (env, devEnv, prodEnv) => {
  $(`#${env.id}_name`).html(tileLine(env.name, 'Most recent build deployed'))
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

      $(`#${env.id}_name`).html(tileLine(env.name, diffDescription))
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
    $(`#${devEnv.id}_name`).html(tileLine(devEnv.name, diffDescription))
  }
}

const fetchMessages = async queryStringOptions => {
  const queryString = new URLSearchParams(queryStringOptions).toString()
  const csrfToken = $('#csrf').val()
  const response = await fetch('/drift-radiator/queue', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ streams: lastIds }),
  })

  if (!response.ok) {
    throw new Error('There was a problem fetching the component data')
  }

  try {
    const streamJson = await response.json()

    streamJson.forEach(({ name, messages }) => {
      const streamName = name.split(':')
      const {
        id,
        message: { v: version },
      } = messages[messages.length - 1]
      lastIds[streamName] = id

      const [date, build, sha] = version.split('.')
      const envId = streamName.slice(streamName.length - 2).join('_')
      const thisEnv = envs[envId]
      thisEnv.version = { full: version, date, build, sha }

      updateVersion(thisEnv, envs[thisEnv.devEnvId], envs[thisEnv.prodEnvId])
    })
  } catch (e) {
    console.error(e)
  }
}

const watch = async () => {
  await fetchMessages(lastIds)
  setTimeout(watch, 10000)
}

jQuery(function () {
  watch()
})
