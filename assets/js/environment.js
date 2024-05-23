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
  // Start with null's in the the arrays so all traces appear in the legend.
  const traceUpX = [null]
  const traceUpY = [null]
  const traceUpText = [null]
  const traceDownX = [null]
  const traceDownY = [null]
  const traceDownText = [null]
  const traceUnknownX = [null]
  const traceUnknownY = [null]
  const traceUnknownText = [null]
  var rangeStart
  for (let i = 0; i < stream.length; i++) {
    const eventEpochTime = parseInt(stream[i].id.split('-')[0])
    const eventTimeStart = new Date(eventEpochTime)
    if (i == 0) {
      rangeStart = eventTimeStart
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

    const eventStatus = parseInt(stream[i].message.http_s)
    if (eventStatus == 200) {
      traceUpX.push(eventTimeStart)
      traceUpY.push(eventStatus)
      traceUpText.push(healthOutput)
    } else if (eventStatus == 0) {
      traceUnknownX.push(eventTimeStart)
      traceUnknownY.push(eventStatus)
      traceUnknownText.push(healthOutput)
    } else {
      traceDownX.push(eventTimeStart)
      traceDownY.push(eventStatus)
      traceDownText.push(healthOutput)
    }
  }

  var traceUp = {
    type: 'scatter',
    mode: 'markers',
    marker: {
      color: '#00703c',
      size: 10,
      symbol: 'circle',
    },
    name: 'Up',
    x: traceUpX,
    y: traceUpY,
    text: traceUpText,
    hovertemplate: '%{x}' + '<br><b>HTTP</b>: %{y}',
    connectgaps: false,
  }

  var traceDown = {
    type: 'scatter',
    mode: 'markers',
    marker: {
      color: '#d4351c',
      size: 15,
      symbol: 'triangle-up',
    },
    name: 'Down',
    x: traceDownX,
    y: traceDownY,
    text: traceDownText,
    hovertemplate: '%{x}' + '<br><b>HTTP</b>: %{y}',
    connectgaps: false,
  }

  var traceUnknown = {
    type: 'scatter',
    mode: 'markers',
    marker: {
      color: '#000000',
      size: 15,
      symbol: 'star-square',
    },
    name: 'Connection Error',
    x: traceUnknownX,
    y: traceUnknownY,
    text: traceUnknownText,
    hovertemplate: '%{x}' + '<br><b>HTTP</b>: %{y}',
    connectgaps: false,
  }

  var statusData = [traceUp, traceDown, traceUnknown]

  const dateNow = new Date(Date.now())
  const dateNowMinus1Hour = new Date(Date.now())
  const rangeSelectorStart = new Date(dateNowMinus1Hour.setHours(dateNowMinus1Hour.getHours() - 1))

  var layout = {
    //autosize: true,
    xaxis: {
      maxallowed: dateNow,
      minallowed: rangeStart,
      range: [rangeSelectorStart, dateNow],
      automargin: false,
      rangeselector: {
        buttons: [
          {
            count: 1,
            label: '1h',
            step: 'hour',
            stepmode: 'backward',
          },
          {
            count: 6,
            label: '6h',
            step: 'hour',
            stepmode: 'backward',
          },
          {
            count: 12,
            label: '12h',
            step: 'hour',
            stepmode: 'backward',
          },
          {
            count: 1,
            label: '1d',
            step: 'day',
            stepmode: 'backward',
          },
          {
            count: 2,
            label: '2d',
            step: 'day',
            stepmode: 'backward',
          },
          { step: 'all' }, // this doesn't work, possible bug.
        ],
      },
      rangeslider: { range: [rangeStart, dateNow] },
      type: 'date',
    },
    yaxis: {
      type: 'category',
      title: 'http status',
    },
  }

  Plotly.newPlot('healthChart', statusData, layout, { displayModeBar: false })
  var myPlot = document.getElementById('healthChart')
  myPlot.on('plotly_click', function (data) {
    var healthText
    for (var i = 0; i < data.points.length; i++) {
      healthText = data.points[i].text
    }
    if (healthText) {
      $(`#healthOutputSelected`).text(healthText)
    }
  })
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
    let eventTimeEnd = new Date(Date.now()) // Default endtime for events

    // This makes the time line look better if each block butts up to the next,
    // however we need to see the big gaps, e.g. if there are missing data.
    if (stream[i + 1]) {
      const nextEventEpochTime = parseInt(stream[i + 1].id.split('-')[0])
      eventTimeEnd = new Date(nextEventEpochTime)
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
  google.charts.load('current', { packages: ['corechart'] })
  google.charts.load('current', { packages: ['timeline'] })
  google.charts.load('current', { packages: ['annotationchart'] })
  google.charts.setOnLoadCallback(watch)
})
