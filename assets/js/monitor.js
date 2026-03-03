jQuery(async function () {
  const monitorType = $('#monitorType').val()
  const monitorId = $('#monitorId').val()
  const monitorName = $('#monitorName').val()

  if (monitorType === '') return

  const dropDownTypeId = monitorId && monitorId !== '0' ? parseInt(monitorId, 10) : 0
  const ajaxUrl = `/monitor/components/${monitorType}/${dropDownTypeId}?slug=${encodeURIComponent(monitorName)}`

  let monitorTimeoutId = null

  function startWatch() {
    stopWatch()

    const watch = async () => {
      await fetchMessages()
      monitorTimeoutId = setTimeout(watch, 30000)
    }
    watch()
  }

  function stopWatch() {
    if (monitorTimeoutId) {
      clearTimeout(monitorTimeoutId)
      monitorTimeoutId = null
    }
  }

  // columns for DataTable (static fields + placeholders for live fields populated by fetchMessages)
  const columns = [
    {
      data: 'componentName',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/components/${rowData.componentName}" class="statusTileName" target="_blank">${rowData.componentName}</a>`,
        )
      },
    },
    {
      data: 'dependentCount',
      visible: false,
    },
    {
      data: 'environmentName',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/components/${rowData.componentName}/environment/${rowData.environmentName}" class="statusTileEnvironment" target="_blank">${rowData.environmentName} (${rowData.environmentType})</a>`,
        )
      },
    },
    {
      data: null,
      createdCell: function (td, _cellData, rowData) {
        const healthLink = rowData.environmentHealth
          ? `<a href="${rowData.environmentUrl}${rowData.environmentHealth}" class="statusTileHealth" target="_blank">View</a>`
          : 'N/A'
        $(td).html(healthLink)
      },
    },
    {
      data: null,
      className: 'statusTileBuild',
      defaultContent: '',
    },
    {
      data: null,
      className: 'statusTileStatus',
      defaultContent: '',
    },
    {
      data: null,
      className: 'statusTileLastRefresh',
      defaultContent: '',
    },
  ]

  const monitorTable = createTable({
    id: 'statusTable',
    ajaxUrl,
    orderColumn: 0,
    orderType: 'asc',
    columns,
    pageLength: -1,
    responsive: true,
    stateSave: false,
    createdRow: function (row, data) {
      $(row).attr('id', `tile-${data.componentName}-${data.environmentName}`)
      $(row).attr('data-prisons', data.isPrisons)
      $(row).attr('data-probation', data.isProbation)
      $(row).attr('data-environment', data.environmentName)
      $(row).attr('data-environment-type', data.environmentType)
    },
    ajaxErrorHandler: function (jqXHR, textStatus, errorThrown) {
      console.error('Health Monitor DataTables error:', textStatus, errorThrown, jqXHR)
    },
  })

  monitorTable.on('xhr', () => {
    startWatch()
    updateEnvironmentList()
  })

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
    let replaceStateUrl = `/monitor/${dropDownType}/${formatMonitorName(dropDownText)}`

    if (dropDownTypeId === 0) {
      dropDownType = 'all'
      replaceStateUrl = '/monitor'
    }

    history.replaceState({ info: 'dropdown change' }, '', replaceStateUrl)

    try {
      const newAjaxUrl = `/monitor/components/${dropDownType}/${dropDownTypeId}?slug=${encodeURIComponent(dropDownSlug)}`
      monitorTable.ajax.url(newAjaxUrl).load()
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

  let showProbation = $('#hmpps-area-probation').is(':checked')
  let showPrisons = $('#hmpps-area-prisons').is(':checked')
  let showStatusUp = $('#status-up').is(':checked')
  let showStatusDown = $('#status-down').is(':checked')
  let showStatusMissing = $('#status-missing').is(':checked')

  $('.environments .govuk-checkboxes__input:checked').each((index, e) => {
    const environment = $(e).val()

    if (validEnvironments.includes(environment)) {
      selectedEnvironments.push(environment)
    }
  })

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
