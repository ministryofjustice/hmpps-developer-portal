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
        dropDownType = 'serviceArea'
        break
      case 'updateCustomComponentView':
        dropDownType = 'customComponentView'
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
  const validEnvironments = ['prod', 'preprod', 'test', 'stage', 'dev']

  $('#statusRows tr').show()

  if (!$('#status-up').is(':checked')) {
    $('.statusTileUp').hide()
  }
  if (!$('#status-down').is(':checked')) {
    $('.statusTileDown').hide()
  }
  if (!$('#status-missing').is(':checked')) {
    $('#statusRows tr').each(function () {
      if (!$(this).hasClass('statusTileDown') && !$(this).hasClass('statusTileUp')) {
        $(this).hide()
      }
    })
  }
  if ($('#hmpps-area-probation').is(':checked')) {
    $('#statusRows tr').each(function () {
      console.log($(this).data('probation'))
      if ($(this).data('probation')) {
        $(this).show()
      } else {
        $(this).hide()
      }
    })
  }
  if ($('#hmpps-area-prisons').is(':checked')) {
    $('#statusRows tr').each(function () {
      if ($(this).data('prisons')) {
        $(this).show()
      } else {
        $(this).hide()
      }
    })
  }

  $('.environments .govuk-checkboxes__input:not(:checked)').each((index, e) => {
    const environment = $(e).val()

    if (validEnvironments.includes(environment)) {
      $(`.${environment}`).hide()
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
    const envs = await response.json()
    envs.forEach(([streamName, env]) => {
      const [component, environment] = streamName.split(':')
      const { version, lastMessageTime, healthStatus } = env

      $(`#tile-${component}-${environment} .statusTileBuild`).text(version)
      $(`#tile-${component}-${environment} .statusTileLastRefresh`).text(lastMessageTime)
      try {
        $(`#tile-${component}-${environment} .statusTileStatus`).text(healthStatus)
        $(`#tile-${component}-${environment}`).removeClass('statusTileUp statusTileDown')

        const statusClass = healthStatus === 'UP' ? 'statusTileUp' : 'statusTileDown'
        $(`#tile-${component}-${environment}`).addClass(statusClass)
      } catch (e) {
        console.error('Error parsing JSON data')
        console.error(e)
      }
    })
  } catch (e) {
    console.error(e)
  }
}

async function populateComponentTable(monitorType, monitorTypeId) {
  const response = await fetch(`/monitor/components/${monitorType}/${monitorTypeId}`)

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
      const healthLink = environment.environmentHealth
        ? `<a href="${environment.environmentUrl}${environment.environmentHealth}" class="statusTileHealth">View</a>`
        : 'N/A'
      lastIds[`health:${environment.componentName}:${environment.environmentName}`] = '0'
      lastIds[`info:${environment.componentName}:${environment.environmentName}`] = '0'
      lastIds[`version:${environment.componentName}:${environment.environmentName}`] = '0'
      data[`health:${environment.componentName}:${environment.environmentName}`] = ''
      data[`info:${environment.componentName}:${environment.environmentName}`] = ''
      data[`version:${environment.componentName}:${environment.environmentName}`] = ''
      $('#statusRows')
        .append(`<tr data-test="tile-${environment.componentName}" data-prisons="${environment.isPrisons}" data-probation="${environment.isProbation}" id="tile-${environment.componentName}-${environment.environmentName}" class="${environment.environmentType}">
          <td><a href="/components/${environment.componentName}" class="statusTileName">${environment.componentName}</a></td>
          <td><a href="/components/${environment.componentName}/environment/${environment.environmentName}" class="statusTileEnvironment">${environment.environmentName}</a></td>
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
