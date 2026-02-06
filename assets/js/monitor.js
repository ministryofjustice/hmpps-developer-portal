jQuery(async function () {
  const monitorType = $('#monitorType').val()
  const monitorId = $('#monitorId').val()
  const monitorName = $('#monitorName').val()

  if (monitorType !== '') {
    const dropDownTypeId = monitorId && monitorId !== '0' ? parseInt(monitorId, 10) : 0

    try {
      await populateComponentTable(monitorType, dropDownTypeId, monitorName)
      updateEnvironmentList()
    } catch (error) {
      console.error('Error populating component table:', error)
    }
  }

  $('#updateProduct,#updateTeam,#updateServiceArea,#updateCustomComponentView').on('click', async e => {
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
        dropDownType = 'service-area'
        break
      case 'updateCustomComponentView':
        dropDownType = 'custom-component-view'
        break
      default:
        return false
    }

    const dropDownText = $(`#${dropDownType} option:selected`).text()
    const dropDownSlug = $(`#${dropDownType} option:selected`).attr('data-slug')
    const dropDownTypeIdValue = Number.parseInt($(`#${dropDownType}`).val())
    const dropDownTypeId = Number.isNaN(dropDownTypeIdValue) ? 0 : dropDownTypeIdValue
    let pushStateUrl = `/monitor/${dropDownType}/${formatMonitorName(dropDownText)}`

    if (dropDownTypeId === 0) {
      dropDownType = 'all'
      pushStateUrl = '/monitor'
    }

    history.pushState({ info: 'dropdown change' }, '', pushStateUrl)

    try {
      await populateComponentTable(dropDownType, dropDownTypeId, dropDownSlug)
      updateEnvironmentList()
    } catch (error) {
      console.error('Error updating selection:', error)
    }
  })

  $('.environments .govuk-checkboxes__input,.status .govuk-checkboxes__input,.area .govuk-checkboxes__input').on(
    'change',
    e => {
      updateEnvironmentList()
    },
  )
})

function updateEnvironmentList() {
  const validEnvironments = ['prod', 'preprod', 'test', 'stage', 'dev']
  const selectedEnvironments = []
  let showProbation = false
  let showPrisons = false
  let showStatusUp = false
  let showStatusDown = false
  let showStatusMissing = false

  $('.environments .govuk-checkboxes__input:checked').each((index, e) => {
    const environment = $(e).val()

    if (validEnvironments.includes(environment)) {
      selectedEnvironments.push(environment)
    }
  })

  if ($('#status-up').is(':checked')) {
    showStatusUp = true
  }

  if ($('#status-down').is(':checked')) {
    showStatusDown = true
  }

  if ($('#status-missing').is(':checked')) {
    showStatusMissing = true
  }

  if ($('#hmpps-area-probation').is(':checked')) {
    showProbation = true
  }

  if ($('#hmpps-area-prisons').is(':checked')) {
    showPrisons = true
  }

  $('#statusRows tr')
    .hide()
    .each(function () {
      const isPrisons = $(this).data('prisons')
      const isProbation = $(this).data('probation')
      const environmentType = $(this).data('environment-type')
      const status = $(this).data('status')

      if (
        ((showPrisons && isPrisons) || (showProbation && isProbation)) &&
        ((showStatusUp && isUp(status)) ||
          (showStatusDown && isDown(status)) ||
          (showStatusMissing && !isUp(status) && !isDown(status))) &&
        selectedEnvironments.includes(environmentType)
      ) {
        $(this).show()
      }
    })
}

const watch = async () => {
  await fetchMessages()

  setTimeout(watch, 30000)
}

const fetchMessages = async () => {
  const csrfToken = $('#csrf').val()
  const response = await fetch('/monitor/queue', {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
  })

  if (!response.ok) {
    throw new Error('There was a problem fetching the component data')
  }

  try {
    const envs = await response.json()
    envs.forEach(([streamName, env]) => {
      try {
        const [component, environment] = streamName.split(':')
        const { version, lastMessageTime, dateAdded, healthStatus } = env
        const tileName = `#tile-${component}-${environment}`

        if ($(tileName).length > 0) {
          $(`${tileName} .statusTileBuild`).text(version)
          $(`${tileName} .statusTileLastRefresh`).text(lastMessageTime)
          $(`${tileName} .statusTileStatus`).text(healthStatus)
          $(tileName).removeClass('statusTileUp statusTileDown')

          let statusClass
          // Check the last time we received data from this endpoint
          // If older than 10 mins, mark as stale.
          if (new Date() - new Date(dateAdded) > 60 * 10 * 1000) {
            statusClass = 'statusTileStale'
          } else {
            statusClass = isUp(healthStatus) ? 'statusTileUp' : 'statusTileDown'
          }

          $(tileName).addClass(statusClass)
          $(tileName).attr('data-status', healthStatus)
        }
      } catch (forEachError) {
        console.error(forEachError)
      }
    })
  } catch (jsonResponseError) {
    console.error(jsonResponseError)
  }
}

async function populateComponentTable(monitorType, monitorTypeId, monitorSlug) {
  let url = `/monitor/components/${monitorType}/${monitorTypeId}?slug=${encodeURIComponent(monitorSlug)}`

  const response = await fetch(url)

  if (!response.ok) {
    console.error(`Error fetching component data: ${response.status} ${response.statusText}`)
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
      const healthLink = environment.environmentHealth
        ? `<a href="${environment.environmentUrl}${environment.environmentHealth}" class="statusTileHealth" target="_blank">View</a>`
        : 'N/A'
      $('#statusRows')
        .append(`<tr data-prisons="${environment.isPrisons}" data-probation="${environment.isProbation}" data-environment="${environment.environmentName}" data-environment-type="${environment.environmentType}" id="tile-${environment.componentName}-${environment.environmentName}">
          <td><a href="/components/${environment.componentName}" class="statusTileName" target="_blank">${environment.componentName}</a></td>
          <td><a href="/components/${environment.componentName}/environment/${environment.environmentName}" class="statusTileEnvironment" target="_blank">${environment.environmentName} (${environment.environmentType})</a></td>
          <td>${healthLink}</td>
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

function isUp(status) {
  return status && ['UP', 'GREEN', 'SERVING'].includes(`${status}`.toUpperCase())
}

function isDown(status) {
  return status && ['DOWN', 'UNKNOWN', '500'].includes(`${status}`.toUpperCase())
}
