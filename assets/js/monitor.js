const lastIds = {}
const data = {}

jQuery(function () {
  $('#updateProduct').on('click', async (e) => {
    e.preventDefault(e)

    const response = await fetch(`/monitor/components/product/${$('#product').val()}`)

    if (!response.ok) {
      throw new Error('There was a problem fetching the component data')
    }

    try {
      $('#statusTiles').empty()

      const components = await response.json()

      components.forEach(component => {
        component.environments.forEach(environment => {
          lastIds[`health:${component.name}:${environment.name}`] = '0'
          lastIds[`info:${component.name}:${environment.name}`] = '0'
          lastIds[`version:${component.name}:${environment.name}`] = '0'
          data[`health:${component.name}:${environment.name}`] = ''
          data[`info:${component.name}:${environment.name}`] = ''
          data[`version:${component.name}:${environment.name}`] = ''
          $('#statusTiles').append(`<div class="statusTile" data-test="tile-${component.id}" id="tile-${component.id}">
            <a href="/components/${component.id}">
              <span class="statusTileName">${component.name}</span>
              <span class="statusTileEnvironment">${environment.name}</span>
              <span class="statusTileBuild"></span>
              <span class="statusTileStatus"></span>
              <span class="statusTileLastRefresh"></span>
            </a>
          </div>`)
        })
      })
      watch()
    } catch(e) {
      console.error(e)
    }
  })
})

const watch = async () => {
  await fetchMessages(lastIds)

  setTimeout(watch, 10000)
}

const fetchMessages = async (queryStringOptions) => {
  const queryString = new URLSearchParams(queryStringOptions).toString()
  const response = await fetch(`/monitor/queue/${queryString}`)

  if (!response.ok) {
    throw new Error('There was a problem fetching the component data')
  }

  try {
    const streamJson = await response.json()
    console.log(streamJson)

    // streamJson.forEach(stream => {
    //   const streamName = stream.name.split(':')
    //   const streamType = streamName[0].charAt(0)
    //   const streamKey = `${streamType}:${streamName[2]}`
    //   const lastMessage = stream.messages[stream.messages.length - 1]

    //   if (lastIds[streamKey]) {
    //     lastIds[streamKey] = lastMessage.id
    //   }

    //   if (data.hasOwnProperty(streamKey)) {
    //     data[streamKey] = lastMessage.message

    //     switch (streamType) {
    //       case 'v':
    //         $(`#${streamName[2]}_version`).text(data[streamKey].v)
    //         break
    //       case 'h':
    //         const jsonData = data[streamKey].json
    //         let status = 'UNK'

    //         try {
    //           health = JSON.parse(jsonData)

    //           if (health.hasOwnProperty('status')) {
    //             status = health.status
    //           } else {
    //             status = health.healthy
    //           }
    //         } catch (e) {
    //           console.error('Error parsing JSON data')
    //           console.error(e)
    //         }

    //         $(`#${streamName[2]}_status`).text(status)
    //         break
    //     }
    //   }
    // })
  } catch (e) {
    console.error(e)
  }
}
