const applicationFilter = document.getElementById('application')
const environmentFilter = document.getElementById('environment')
const namespaceFilter = document.getElementById('namespace')
const severityFilter = document.getElementById('severity')
const teamFilter = document.getElementById('team')

jQuery(function () {
  let currentFilters = getFiltersFromURL()
  const rootDataUrl = '/alerts/all'

  const columns = [
    {
      data: 'labels.alertname',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.labels.alertname}`)
      },
    },
    {
      data: 'startsAt',
      createdCell: function (td, _cellData, rowData) {
        // const startsAt = formatTimeStamp(new Date(rowData.startsAt))
        // const startsAt = Date.parse(rowData.startsAt)
        const startsAt = formatTimeStamp(rowData.startsAt)
        $(td).html(`${startsAt}`)
      },
    },
    {
      data: 'annotations.message',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.annotations.message}`)
      },
    },
    {
      data: 'labels.alert_slack_channel',
      createdCell: function (td, _cellData, rowData) {
        const slackName = rowData.labels.alert_slack_channel || 'N/A'
        const slackNameNoHashtag = slackName.slice(1) // removes #
        if (slackName !== 'N/A') {
          $(td).html(
            `<a href="https://slack.com/app_redirect?channel=${slackNameNoHashtag}" target="_blank">${slackName}</a>`,
          )
        } else {
          $(td).html(`${slackName}`)
        }
      },
    },
    {
      data: 'annotations',
      createdCell: function (td, _cellData, rowData) {
        const dashboardLink = rowData.annotations.dashboard_url
          ? `<a href="${rowData.annotations.dashboard_url}" class="statusTileHealth" target="_blank">Dashboard</a>`
          : ''
        const runbookLink = rowData.annotations.runbook_url
          ? `<a href="${rowData.annotations.runbook_url}" class="statusTileHealth" target="_blank">Runbook</a>`
          : ''
        const generatorLink = rowData.generatorURL
          ? `<a href="${rowData.generatorURL}" class="statusTileHealth" target="_blank">View</a>`
          : ''

        $(td).html(`<ul><li>${dashboardLink}</li><li>${runbookLink}</li><li>${generatorLink}</li></ul>`)
      },
    },
    {
      data: 'labels',
      createdCell: function (td, _cellData, rowData) {
        const teamName = rowData.labels.team || 'N/A'
        $(td).html(`${teamName}`)
      },
    },
  ]

  const alertsTable = createTable({
    id: 'alertsTable',
    // ajaxUrl: '/alerts/all',
    ajaxUrl: rootDataUrl,
    orderColumn: 1,
    orderType: 'asc',
    columns,
    responsive: true,
    createdRow: function (row, data, dataIndex) {
      if (data.status.state === 'suppressed') {
        $(row).addClass('silenced-alert')
      } else if (data.status.state === 'active') {
        $(row).addClass('active-alert')
      }
    },
  })
  console.log('create table', createTable)

  let count = 0

  setInterval(function () {
    alertsTable.ajax.reload(null, false) // user paging is not reset on reload
    console.log('data reloaded, count =', (count += 1))
    lastUpdatedTime()
  }, 5000)

  lastUpdatedTime()
  alertsUpdateFrequencyMessage()

  // Trying to add filters to alerts same style as Veracode

  alertsTable.on('xhr', function (_e, settings, json) {
    const rawData = Array.isArray(json) ? json : json.data || []
    console.log('1 - rawData', rawData)

    if (!rawData || !rawData.length) return

    populateTeamDropdown(rawData)

    // Register team filter function
    $.fn.dataTable.ext.search = []
    $.fn.dataTable.ext.search.push(teamFilterFunction(currentFilters))
    alertsTable.draw()
  })

  function populateTeamDropdown(data) {
    console.log('2 - data in popTeamDropdown', data)
    const teams = [...new Set(data.map(item => item.labels.team))].sort()
    console.log('3 - teams:', teams)
    const $teamSelect = $('#team')
    $teamSelect.empty().append('<option value="">All teams</option>')

    teams.forEach(team => {
      $teamSelect.append(`<option value="${team}">${team}</option>`)
    })

    // Set value from URL param on load
    if (currentFilters.team) {
      $teamSelect.val(currentFilters.team)
    }
  }

  function teamFilterFunction(filters) {
    return function (_settings, _data, _dataIndex, rowData) {
      if (filters.team && rowData.team !== filters.team) return false
      return true
    }
  }

  console.log('4 - .team', $('.team'))

  // Pick up from here
  $('#team').on('change', e => {
    e.preventDefault(e)
    const selectedResultFilters = []

    $('#team').each(function () {
      selectedResultFilters.push($(this).val())
    })

    const newDataUrl = `${rootDataUrl}?team=${selectedResultFilters.join(',')}}`
    console.log('5 - newDataURL', newDataUrl)

    alertsTable.ajax.url(newDataUrl).load()
  })

  $('#updateTeam').on('click', function (e) {
    e.preventDefault()

    const selectedTeam = $('#team').val()
    currentFilters.team = selectedTeam

    // Update URL without reload
    updateURLParams(currentFilters)

    // Reapply filter
    $.fn.dataTable.ext.search = []
    $.fn.dataTable.ext.search.push(teamFilterFunction(currentFilters))
    alertsTable.draw(false)
  })
})

function formatTimeStamp(dateString) {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) throw new Error('Invalid date')
    return date
      .toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(',', '')
      .toUpperCase()
  } catch (error) {
    return 'Invalid date'
  }
}

function alertsUpdateFrequencyMessage() {
  $('#alertsFetchStatus').empty()
  return $('#alertsFetchStatus').append(
    `<div class="govuk-inset-text">Alerts are being updated every <strong>5</strong> seconds</div>`,
  )
}

function lastUpdatedTime() {
  const currentTime = new Date()
  // console.log("current date -", currentTime)
  // console.log("get Time - ", currentTime.getTime())
  const lastUpdatedTimestamp = formatTimeStamp(currentTime)
  document.getElementById('lastUpdated').textContent = `Last updated: ${lastUpdatedTimestamp}`
}

// Team's filters

// function checks url params for applied filters and builds filter object
function getFiltersFromURL() {
  const params = new URLSearchParams(location.search)
  return {
    team: params.get('team') || '',
  }
}

// add current filters to Url params
function updateURLParams(filters) {
  const params = new URLSearchParams()
  if (filters.team) params.set('team', filters.team)

  history.replaceState(null, '', `?${params.toString()}`)
}
