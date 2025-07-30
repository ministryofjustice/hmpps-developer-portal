const applicationFilter = document.getElementById('application')
const environmentFilter = document.getElementById('environment')
const namespaceFilter = document.getElementById('namespace')
const severityFilter = document.getElementById('severity')
const teamFilter = document.getElementById('team')

jQuery(function () {
  // checks URL, to see if any filters are currently applied
  let currentFilters = getFiltersFromURL()
  // alertsData will hold the most recently fetched data
  let alertsData = []

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
    ajaxUrl: '/alerts/all',
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

  let count = 0 // will remove, just keeping whilst I deal with fetch frequency and dropdowns jumping every 5 seconds

  setInterval(function () {
    alertsTable.ajax.reload(null, false) // user paging is not reset on reload
    console.log('data reloaded, count =', (count += 1))
    lastUpdatedTime()
  }, 60000) // set to once a minute for now

  lastUpdatedTime()
  alertsUpdateFrequencyMessage()

  // xhr event is fired when an Ajax request is completed, whether it is successful (data refreshes) or there's an error
  alertsTable.on('xhr', function (_e, settings, json) {
    alertsData = Array.isArray(json) ? json : json.data || []
    if (!alertsData || !alertsData.length) return

    filterOrResetDropdowns(alertsData, currentFilters)

    // Registers allFiltersChecker as a Datatable custom filter function. Determines if a row should be displayed in the table
    $.fn.dataTable.ext.search = []
    $.fn.dataTable.ext.search.push(allFiltersChecker(currentFilters))
    alertsTable.draw()
  })

  // Using ids for all the update buttons, which are mapped to the corresponding filter's key
  $('#updateApplicationName,#updateEnvironment,#updateNamespace,#updateSeverityLabel,#updateTeam').on(
    'click',
    function (e) {
      e.preventDefault()

      const idToKey = {
        updateApplicationName: 'application',
        updateEnvironment: 'environment',
        updateNamespace: 'namespace',
        updateSeverityLabel: 'severity',
        updateTeam: 'team',
      }

      // changed from e.target to this so it always refers to the button's id
      const key = idToKey[this.id]
      if (!key) return

      // creating filter object with values from the dropdowns
      currentFilters[key] = $(`#${key}`).val()

      // Update URL without reload
      updateURLParams(currentFilters)

      // Reapply all filters
      $.fn.dataTable.ext.search = []
      $.fn.dataTable.ext.search.push(allFiltersChecker(currentFilters))
      alertsTable.draw(false)
      filterOrResetDropdowns(alertsData, currentFilters)
    },
  )

  // When reset filters clicked, this clear all filters, reset URL params and updates table
  $('#resetFilters').on('click', function (e) {
    e.preventDefault()
    // Clear filters
    currentFilters = {
      application: '',
      environment: '',
      namespace: '',
      severity: '',
      team: '',
    }
    // Reset selects
    $('#application,#environment,#namespace,#severity,#team').val('')
    updateURLParams(currentFilters)
    // Remove all filters and redraw
    $.fn.dataTable.ext.search = []
    alertsTable.draw(false)
    filterOrResetDropdowns(alertsData, currentFilters)
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
    `<div class="govuk-inset-text">Alerts are being updated every <strong>60</strong> seconds</div>`,
  )
}

function lastUpdatedTime() {
  const currentTime = new Date()
  const lastUpdatedTimestamp = formatTimeStamp(currentTime)
  document.getElementById('lastUpdated').textContent = `Last updated: ${lastUpdatedTimestamp}`
}

// function checks url params for applied filters and builds filter object
function getFiltersFromURL() {
  const params = new URLSearchParams(location.search)
  return {
    application: params.get('application') || '',
    environment: params.get('environment') || '',
    namespace: params.get('namespace') || '',
    severity: params.get('severity') || '',
    team: params.get('team') || '',
  }
}

// add current filters to Url params
function updateURLParams(filters) {
  const params = new URLSearchParams()
  if (filters.application.length) params.set('application', filters.application)
  if (filters.environment) params.set('environment', filters.environment)
  if (filters.namespace) params.set('namespace', filters.namespace)
  if (filters.severity) params.set('severity', filters.severity)
  if (filters.team) params.set('team', filters.team)

  history.replaceState(null, '', `?${params.toString()}`)
}

// Checks all filters for each row, filtering out any false rows. Returns true where all filters match (or are empty)
function allFiltersChecker(filters) {
  return function (_settings, _data, _dataIndex, rowData) {
    if (filters.application && rowData.labels.application !== filters.application) return false
    if (filters.environment && rowData.labels.environment !== filters.environment) return false
    if (filters.namespace && rowData.labels.namespace !== filters.namespace) return false
    if (filters.severity && rowData.labels.severity !== filters.severity) return false
    if (filters.team && rowData.labels.team !== filters.team) return false
    return true
  }
}

// Filters data by dropdowns, returning an array of matching rows. Used for updating dropdown options
function getFilteredData(data, filters) {
  return data.filter(
    rowData =>
      (!filters.application || rowData.labels.application === filters.application) &&
      (!filters.environment || rowData.labels.environment === filters.environment) &&
      (!filters.namespace || rowData.labels.namespace === filters.namespace) &&
      (!filters.severity || rowData.labels.severity === filters.severity) &&
      (!filters.team || rowData.labels.team === filters.team),
  )
}

// Updates dropdowns with the options related to the current filters or all when reset
function filterOrResetDropdowns(alertsData, currentFilters) {
  const filteredData = getFilteredData(alertsData, currentFilters)

  populateAlertsDropdowns(filteredData, 'application', currentFilters)
  populateAlertsDropdowns(filteredData, 'environment', currentFilters)
  populateAlertsDropdowns(filteredData, 'namespace', currentFilters)
  populateAlertsDropdowns(filteredData, 'severity', currentFilters)
  populateAlertsDropdowns(filteredData, 'team', currentFilters)
}

// Populates a dropdown with options from the filtered data, or to the current filter if present
function populateAlertsDropdowns(data, key, currentFilters) {
  const allOptions = [...new Set(data.map(a => a.labels[`${key}`]))].sort()

  const $dropdownSelect = $(`#${key}`)
  $dropdownSelect.empty().append('<option value=""></option>')

  allOptions.forEach(option => {
    $dropdownSelect.append(`<option value="${option}">${option}</option>`)
  })

  // Set value from URL param on load
  if (currentFilters[`${key}`]) {
    $dropdownSelect.val(currentFilters[`${key}`])
  }
}
