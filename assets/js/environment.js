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
let streamVersionData = []

function drawHealthChart(stream) {
  const container = document.getElementById('healthTimeline')
  const chart = new google.visualization.Timeline(container)
  const dataTable = new google.visualization.DataTable()

  dataTable.addColumn({ type: 'string', id: 'Status' })
  dataTable.addColumn({ type: 'string', id: 'DummyLabel' })
  dataTable.addColumn({ type: 'string', role: 'tooltip' })
  dataTable.addColumn({ type: 'string', id: 'style', role: 'style' })
  dataTable.addColumn({ type: 'date', id: 'Start' })
  dataTable.addColumn({ type: 'date', id: 'End' })

  // Start from last 25
  const offset = 25

  for (let i = stream.length - offset; i < stream.length; i++) {
    const eventEpochTime = parseInt(stream[i].id.split('-')[0])
    const eventTimeStart = new Date(eventEpochTime)
    let eventTimeEnd = new Date(eventEpochTime + 120000) // make events 2 min long by default

    // This makes the time line look better if each block butts up to the next,
    // however we need to see the big gaps, e.g. if there are missing data.
    if (stream[i + 1]) {
      const nextEventEpochTime = parseInt(stream[i + 1].id.split('-')[0])
      // Only if it's less than 5 mins apart.
      if (nextEventEpochTime - eventEpochTime < 300000) {
        eventTimeEnd = new Date(nextEventEpochTime - 10000)
      }
    }

    let healthOutput = null
    if (stream[i].message.hasOwnProperty('error')) {
      healthOutput = stream[i].message.error
    } else if (stream[i].message.hasOwnProperty('json')) {
      try {
        const messageJson = JSON.parse(stream[i].message.json)
        healthOutput = JSON.stringify(messageJson, null, 2)
      } catch (err) {
        console.error(err)
      }
    }

    let rowColour = '#d4351c'

    if (stream[i].message.http_s === '200') {
      rowColour = '#00703c'
    } else if (stream[i].message.http_s === '0') {
      rowColour = '#000000'
    }

    dataTable.addRows([['Status', stream[i].message.http_s, healthOutput, rowColour, eventTimeStart, eventTimeEnd]])
  }

  const options = {
    height: 100,
    avoidOverlappingGridLines: false,
    tooltip: {
      trigger: 'none',
    },
    timeline: {
      groupByRowLabel: true,
      colorByRowLabel: false,
    },
  }

  function selectHandler() {
    var selectedItem = chart.getSelection()[0]
    if (selectedItem) {
      var value = dataTable.getValue(selectedItem.row, 2)
      $(`#healthOutputSelected`).text(value)
    }
  }
  google.visualization.events.addListener(chart, 'select', selectHandler)

  chart.draw(dataTable, options)
}

function drawVersionChart(stream) {
  const container = document.getElementById('versionTimeline')
  const versionChart = new google.visualization.Timeline(container)
  const dataVersionTable = new google.visualization.DataTable()

  dataVersionTable.addColumn({ type: 'string', id: 'Status' })
  dataVersionTable.addColumn({ type: 'string', id: 'DummyLabel' })
  dataVersionTable.addColumn({ type: 'date', id: 'Start' })
  dataVersionTable.addColumn({ type: 'date', id: 'End' })

  for (let i = 0; i < stream.length; i++) {
    const eventEpochTime = parseInt(stream[i].id.split('-')[0])
    const eventTimeStart = new Date(eventEpochTime)
    let eventTimeEnd = new Date(eventEpochTime + 120000) // make events 2 min long by default

    // This makes the time line look better if each block butts up to the next,
    // however we need to see the big gaps, e.g. if there are missing data.
    if (stream[i + 1]) {
      const nextEventEpochTime = parseInt(stream[i + 1].id.split('-')[0])
      eventTimeEnd = new Date(nextEventEpochTime - 10000)
    }

    let versionOutput = 'na'
    if (stream[i].message.hasOwnProperty('v')) {
      try {
        versionOutput = stream[i].message.v
      } catch (err) {
        console.error(err)
      }
    }

    dataVersionTable.addRows([['Status', versionOutput, eventTimeStart, eventTimeEnd]])
  }

  const options = {
    height: 100,
    avoidOverlappingGridLines: false,
    timeline: {
      groupByRowLabel: true,
      colorByRowLabel: false,
    },
  }

  function selectHandler() {
    var selectedItem = versionChart.getSelection()[0]
    if (selectedItem) {
      var version = dataVersionTable.getValue(selectedItem.row, 1)
      var time = dataVersionTable.getValue(selectedItem.row, 2)
      $(`#versionOutputSelected`).text(`Version: ${version} - Deployed @ ${time}`)
    }
  }
  google.visualization.events.addListener(versionChart, 'select', selectHandler)
  versionChart.draw(dataVersionTable, options)
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
            stream.messages.forEach(message => {
              streamVersionData.push(message)
            })
            drawVersionChart(streamVersionData)
            break
          case 'h':
            const httpStatus = data[streamKey].http_s
            const lastTime = new Date(parseInt(lastMessage.id.split('-')[0]))

            stream.messages.forEach(message => {
              streamData.push(message)
            })

            // Don't draw chart if data is more than 5 hours old.
            const currentEpochTime = Date.now()
            if (currentEpochTime - lastTime < 1000 * 60 * 60 * 5) {
              drawHealthChart(streamData)
            }

            let status = 'UNK'

            let output = null
            if (data[streamKey].hasOwnProperty('error')) {
              output = data[streamKey].error
            } else if (data[streamKey].hasOwnProperty('json')) {
              try {
                health = JSON.parse(data[streamKey].json)
                output = JSON.stringify(health, null, 2)

                if (health.hasOwnProperty('status')) {
                  status = health.status
                } else {
                  status = health.healthy === true ? 'UP' : 'DOWN'
                }
              } catch (e) {
                console.error('Error parsing JSON data')
                console.error(e)
              }
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

            $(`#${streamName[2]}_health_raw`).text(output)
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
