dayjs.extend(window.dayjs_plugin_relativeTime)

const lastIds = Object.fromEntries(environments.map(e => [`v:${e}`, 0]))
const data = Object.fromEntries(environments.map(e => [`${e}`, undefined]))

const updateVersion = ({ env, version, date, build, sha }) => {
  data[env] = { version, date, build, sha }
  $(`#${env}_build`).text(build)

  if (env != devEnvName && data[devEnvName]) {
    const devEnvSha = data[devEnvName].sha
    const thisEnvSha = data[env].sha

    const devEnvDate = data[devEnvName].date
    const thisEnvDate = data[env].date

    const humanReadableDate = `${dayjs(devEnvDate).diff(thisEnvDate, 'day')} days behind dev`

    $(`#${env}_date`).text(`${date} (${humanReadableDate})`)

    if (devEnvSha !== thisEnvSha) {
      $(`#${env}_details`).html(`
      <strong>Differences:</strong>
      <a class="govuk-link--no-visited-state" href="https://github.com/ministryofjustice/${componentName}/compare/${thisEnvSha}...${devEnvSha}">View in GitHub</a>
    `)
    }
  } else {
    $(`#${env}_date`).text(date)
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
      const [date, build, sha] = version.split('.')
      updateVersion({ env, version, date, build, sha })
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
