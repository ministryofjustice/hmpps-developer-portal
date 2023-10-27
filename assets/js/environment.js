const lastIds = {
  [`h:${environmentName}`]: '0',
  [`i:${environmentName}`]: '0',
  [`v:${environmentName}`]: '0',
}
const data = {
  [`h:${environmentName}`]: '',
  [`i:${environmentName}`]: '',
  [`v:${environmentName}`]: '',
}
let streamData = []

function drawChart(stream) {
  const container = document.getElementById('healthTimeline')
  const chart = new google.visualization.Timeline(container)
  const dataTable = new google.visualization.DataTable()

  dataTable.addColumn({ type: 'string', id: 'Status' })
  dataTable.addColumn({ type: 'string', id: 'DummyLabel' })
  dataTable.addColumn({ type: 'string', role: 'tooltip' })
  dataTable.addColumn({ type: 'string', id: 'style', role: 'style' })
  dataTable.addColumn({ type: 'date', id: 'Start' })
  dataTable.addColumn({ type: 'date', id: 'End' })

  // Start at from last 20
  const offset = 20
  
  for (let i = stream.length - offset; i < stream.length; i++) {
    const eventEpochTime = parseInt(stream[i].id.split('-')[0])
    const eventTimeStart = new Date(eventEpochTime)
    let eventTimeEnd = new Date(eventEpochTime + 120000) // make events 2 min long

    if (stream[i + 1]) {
      const nextEventEpochTime = parseInt(stream[i + 1].id.split('-')[0])
      eventTimeEnd = new Date(nextEventEpochTime - 10000)
    }

    let prettyJson = stream[i].message.json

    try {
      const messageJson = JSON.parse(stream[i].message.json)
      prettyJson = JSON.stringify(messageJson, null, 2)
    } catch (err) {
      console.error(err)
    }

    prettyJson = `<pre class="healthOutputHover">${prettyJson}</pre>`

    let rowColour = '#d4351c'

    if (stream[i].message.http_s === '200') {
      rowColour = '#00703c'
    } else if (stream[i].message.http_s === '0') {
      rowColour = '#000000'
    }

    dataTable.addRows([['Status', stream[i].message.http_s, prettyJson, rowColour, eventTimeStart, eventTimeEnd]])
  }

  const options = {
    avoidOverlappingGridLines: false,
    timeline: {
      groupByRowLabel: true,
      colorByRowLabel: false,
    },
  }

  chart.draw(dataTable, options)
}

const fetchMessages = async queryStringOptions => {
  const queryString = new URLSearchParams(queryStringOptions).toString()
  const response = await fetch(`/components/queue/${componentName}/${environmentName}/${queryString}`)

  if (!response.ok) {
    throw new Error('There was a problem fetching the component data')
  }

  try {
    const streamJson = await response.json()

    streamJson.forEach(stream => {
      const streamName = stream.name.split(':')
      const streamType = streamName[0].charAt(0)
      const streamKey = `${streamType}:${streamName[2]}`
      const lastMessage = stream.messages[stream.messages.length - 1]

      if (lastIds[streamKey]) {
        lastIds[streamKey] = lastMessage.id
      }

      if (data.hasOwnProperty(streamKey)) {
        data[streamKey] = lastMessage.message

        switch (streamType) {
          case 'v':
            $(`#${streamName[2]}_version`).text(data[streamKey].v)
            break
          case 'h':
            const jsonData = data[streamKey].json
            const httpStatus = data[streamKey].http_s
            const lastTime = new Date(parseInt(lastMessage.id.split('-')[0]))

            stream.messages.forEach(message => {
              streamData.push(message)
            })

            drawChart(streamData)
            let status = 'UNK'

            try {
              health = JSON.parse(jsonData)

              if (health.hasOwnProperty('status')) {
                status = health.status
              } else {
                status = health.healthy === true ? 'UP' : 'DOWN'
              }
              if (status === 'UNK') {
                $(`#${streamName[2]}_status`).removeClass('statusTileDown')
                $(`#${streamName[2]}_status`).removeClass('statusTileUp')
              } else if (httpStatus === '200') {
                $(`#${streamName[2]}_status`).removeClass('statusTileDown')
                $(`#${streamName[2]}_status`).addClass('statusTileUp')
              } else {
                $(`#${streamName[2]}_status`).removeClass('statusTileUp')
                $(`#${streamName[2]}_status`).addClass('statusTileDown')
              }

              $(`#${streamName[2]}_health_raw`).text(JSON.stringify(health, null, 2))
            } catch (e) {
              console.error('Error parsing JSON data')
              console.error(e)
            }

            $(`#${streamName[2]}_status`).text(status)
            $(`#${streamName[2]}_last_updated`).text(lastTime.toLocaleString())

            break
        }
      }
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
  google.charts.load('current', { packages: ['timeline'] })
  google.charts.setOnLoadCallback(watch)
})
