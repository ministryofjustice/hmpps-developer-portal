const lastIds = {}
const data = {}

jQuery(async function () {
  const monitorType = $('#monitorType').val()

  if (monitorType !== '') {
    const dropDownTypeIdValue = Number.parseInt($(`#${monitorType}`).val())
    const dropDownTypeId = Number.isNaN(dropDownTypeIdValue) ? 0 : dropDownTypeIdValue

    await populateComponentTable(monitorType, dropDownTypeId)
    updateEnvironmentList()
  }

  $('#updateProduct,#updateTeam,#updateServiceArea').on('click', async e => {
    e.preventDefault(e)

    let dropDownType = ''

    switch (e.target.id) {
      case 'updateProduct':
        dropDownType = 'product'
        break
      case 'updateTeam':
        dropDownType = 'team'
        break
      case 'updateServiceArea':
        dropDownType = 'serviceArea'
        break
      default:
        return false
    }

    const dropDownText = $(`#${dropDownType} option:selected`).text()
    const dropDownTypeIdValue = Number.parseInt($(`#${dropDownType}`).val())
    const dropDownTypeId = Number.isNaN(dropDownTypeIdValue) ? 0 : dropDownTypeIdValue
    let pushStateUrl = `/monitor/${dropDownType}/${formatMonitorName(dropDownText)}`

    if (dropDownTypeId === 0) {
      dropDownType = 'all'
      pushStateUrl = '/monitor'
    }

    history.pushState({ info: 'dropdown change' }, '', pushStateUrl)

    await populateComponentTable(dropDownType, dropDownTypeId)
    updateEnvironmentList()
  })

  $('.environments .govuk-checkboxes__input').on('change', e => {
    updateEnvironmentList()
  })
})

function updateEnvironmentList() {
  const validEnvironments = ['prod', 'preprod', 'staging', 'stage', 'dev']

  $(`.${validEnvironments.join(',.')}`).show()
  $('.environments .govuk-checkboxes__input:not(:checked)').each((index, e) => {
    const environment = $(e).val()

    if (validEnvironments.includes(environment)) {
      $(`.${environment}`).hide()

      if (environment === 'staging') {
        $('.stage').hide()
      }
    }
  })
}

const watch = async () => {
  await fetchMessages(lastIds)

  setTimeout(watch, 30000)
}

const fetchMessages = async streams => {
  const csrfToken = $('#csrf').val()
  const response = await fetch('/monitor/queue', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ streams }),
  })

  if (!response.ok) {
    throw new Error('There was a problem fetching the component data')
  }

  try {
    const streamJson = await response.json()

    streamJson.forEach(stream => {
      const streamName = stream.name
      const streamNameParts = streamName.split(':')
      const streamType = streamNameParts[0].charAt(0)
      const component = streamNameParts[1]
      const environment = streamNameParts[2]
      const lastMessage = stream.messages[stream.messages.length - 1]

      if (lastIds[streamName]) {
        lastIds[streamName] = lastMessage.id
      }

      if (data.hasOwnProperty(streamName)) {
        data[streamName] = lastMessage.message
        const dateString = new Date().toTimeString().substring(0, 8)
        $(`#tile-${component}-${environment} .statusTileLastRefresh`).text(dateString)

        switch (streamType) {
          case 'v':
            $(`#tile-${component}-${environment} .statusTileBuild`).text(data[streamName].v)
            break
          case 'h':
            try {
              if (data[streamName].json) {
                const jsonData = data[streamName].json

                let status = 'UNK'
                health = JSON.parse(jsonData)

                if (health.hasOwnProperty('status')) {
                  status = health.status
                } else {
                  status = health.healthy
                }

                $(`#tile-${component}-${environment} .statusTileStatus`).text(status)
                $(`#tile-${component}-${environment}`).removeClass('statusTileUp statusTileDown')

                const statusClass = status === true || status === 'UP' ? 'statusTileUp' : 'statusTileDown'

                $(`#tile-${component}-${environment}`).addClass(statusClass)
              }
            } catch (e) {
              console.error('Error parsing JSON data')
              console.error(e)
            }

            break
        }
      }
    })
  } catch (e) {
    console.error(e)
  }
}

async function populateComponentTable(type, id) {
  const response = await fetch(`/monitor/components/${type}/${id}`)

  if (!response.ok) {
    throw new Error('There was a problem fetching the component data')
  }

  function sortEnvironments(environmentA, environmentB) {
    if (environmentA.componentName < environmentB.componentName) {
      return -1
    } else if (environmentA.componentName > environmentB.componentName) {
      return 1
    }

    return 0
  }

  try {
    $('#statusRows').empty()

    const environments = await response.json()

    environments.sort(sortEnvironments).forEach(environment => {
      lastIds[`health:${environment.componentName}:${environment.environmentName}`] = '0'
      lastIds[`info:${environment.componentName}:${environment.environmentName}`] = '0'
      lastIds[`version:${environment.componentName}:${environment.environmentName}`] = '0'
      data[`health:${environment.componentName}:${environment.environmentName}`] = ''
      data[`info:${environment.componentName}:${environment.environmentName}`] = ''
      data[`version:${environment.componentName}:${environment.environmentName}`] = ''
      $('#statusRows')
        .append(`<tr data-test="tile-${environment.componentId}" id="tile-${environment.componentName}-${environment.environmentName}" class="${environment.environmentName}">
          <td><a href="/components/${environment.componentId}" class="statusTileName">${environment.componentName}</a></td>
          <td class="statusTileEnvironment">${environment.environmentName}</td>
          <td class="statusTileBuild"></td>
          <td class="statusTileStatus"></td>
          <td class="statusTileLastRefresh"></td>
        </tr>`)
    })

    watch()
  } catch (e) {
    console.error(e)
  }
}

function formatMonitorName(name) {
  return `${name} `
    .trim()
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^-a-z0-9]/g, '')
    .replace(/-+/g, '-')
}
