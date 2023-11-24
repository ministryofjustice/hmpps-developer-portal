dayjs.extend(window.dayjs_plugin_relativeTime)

const lastIds = Object.fromEntries(environments.map(e => [`v:${e}`, 0]))
const data = Object.fromEntries(environments.map(e => [`${e}`, undefined]))

const tileLine = (label, value) => `<strong>${label}:</strong><span class="tile-value">${value}</span><br/>`
const tileLink = (title, href) => `<a class="govuk-link--no-visited-state" href="${href}">${title}</a>`

const updateVersion = ({ env, version }) => {
  const [date, build, sha] = version.split('.')
  data[env] = { version, date, build, sha }

  $(`#${env}_details`).html(`
    ${tileLine('Environment', env)}
    ${tileLine('Build date', date)}
    ${tileLine('Build number', build)}`)

  if (env != devEnvName && data[devEnvName]) {
    const devEnvSha = data[devEnvName].sha
    const thisEnvSha = data[env].sha

    const devEnvDate = data[devEnvName].date
    const thisEnvDate = data[env].date

    const daysDiff = devEnvSha === thisEnvSha ? -1 : dayjs(devEnvDate).diff(thisEnvDate, 'day')

    // Decrease denominator to increase rate of change , increase daysDiff to increase initial jump
    const diffScore = (daysDiff + 6) / 15

    const hue = Math.max(0, (1 - diffScore) * 120).toString(10)

    const style = `hsl(${hue},50%,50%)`
    $(`#${env}_indicator`).css('background-color', style)

    const gitDiffUrl = `https://github.com/ministryofjustice/${componentName}/compare/${thisEnvSha}...${devEnvSha}`

    if (devEnvSha !== thisEnvSha) {
      $(`#${env}_details`).html(`
        ${tileLine('Environment', env)}
        ${tileLine('Build date', date)}
        ${tileLine('Build number', build)}
        ${tileLine('Staleness', `${daysDiff} days behind dev`)}
        ${tileLine('Differences', tileLink('View in GitHub', gitDiffUrl))}
    `)
    }
  }
}

const fetchMessages = async queryStringOptions => {
  const queryString = new URLSearchParams(queryStringOptions).toString()
  const response = await fetch(`/drift-radiator/queue/${componentName}/${queryString}`)

  if (!response.ok) {
    throw new Error('There was a problem fetching the component data')
  }

  try {
    const streamJson = await response.json()

    streamJson.forEach(stream => {
      const streamName = stream.name.split(':')
      const streamType = streamName[0].charAt(0)
      const streamKey = `${streamType}:${streamName[2]}`
      const env = streamName[2]

      const lastMessage = stream.messages[stream.messages.length - 1]
      if (lastIds[streamKey]) {
        lastIds[streamKey] = lastMessage.id
      }

      const version = lastMessage.message.v
      updateVersion({ env, version })
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
