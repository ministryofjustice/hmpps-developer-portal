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
  // timer ticks if a dropdown is open, data fetches every 30 seconds instead of 5
  let isDropDownOpen = false
  let timer = 0

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
      data: 'labels.application',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.labels.application}`)
      },
    },
    {
      data: 'labels.alert_slack_channel',
      // default content to handle missing column data - prevents rendering issues for when no data for slack channel
      defaultContent: 'N/A',
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
    ajaxErrorHandler: function (jqXHR, textStatus, errorThrown) {
      $('#alertsErrorStatus').html(
        `<div role="region" class="moj-alert moj-alert--error" aria-label="error: Unable to load alerts data. Please try again later" data-module="moj-alert">
          <div>
            <svg
              class="moj-alert__icon"
              role="presentation"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 30 30"
              height="30"
              width="30"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M20.1777 2.5H9.82233L2.5 9.82233V20.1777L9.82233 27.5H20.1777L27.5 20.1777V9.82233L20.1777 2.5ZM10.9155 8.87769L15.0001 12.9623L19.0847 8.87771L21.1224 10.9154L17.0378 15L21.1224 19.0846L19.0847 21.1222L15.0001 17.0376L10.9155 21.1223L8.87782 19.0846L12.9624 15L8.87783 10.9153L10.9155 8.87769Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div class="moj-alert__content">
            Unable to load alerts data. Please try again later
          </div>
        </div>`,
      )
      console.error('DataTables error:', textStatus, errorThrown, jqXHR)
    },
  })

  // Alerts API called every 5 seconds. If a dropdown is open, timer increases and API called every 30 seconds
  setInterval(function () {
    const { newTime, dataShouldRefresh } = isDataThirtySecondsOld(timer)
    timer = newTime

    // Timer resets to 0 when API called
    if (!isDropDownOpen || dataShouldRefresh) {
      alertsTable.ajax.reload(null, false) // user paging is not reset on reload
      timer = 0
      lastUpdatedTime()
    }
  }, 5000)

  lastUpdatedTime()
  alertsUpdateFrequencyMessage(isDropDownOpen)

  // xhr event is fired when an Ajax request is completed, whether it is successful (data refreshes) or there's an error
  alertsTable.on('xhr', function (_e, settings, json) {
    $('#alertsErrorStatus').empty()

    alertsData = Array.isArray(json) ? json : json.data || []
    if (!alertsData || !alertsData.length) return

    filterOrResetDropdowns(alertsData, currentFilters)

    // Registers allFiltersChecker as a Datatable custom filter function. Determines if a row should be displayed in the table
    $.fn.dataTable.ext.search = []
    $.fn.dataTable.ext.search.push(allFiltersChecker(currentFilters))
    alertsTable.draw()
  })

  // On click of any 'Update' button to apply filters. Button ids mapped to corresponding filter's key
  $('#updateApplicationName,#updateEnvironment,#updateNamespace,#updateSeverityLabel,#updateTeam').on(
    'click',
    function (e) {
      e.preventDefault()

      const buttonIdToFilterKey = {
        updateApplicationName: 'application',
        updateEnvironment: 'environment',
        updateNamespace: 'namespace',
        updateSeverityLabel: 'severity',
        updateTeam: 'team',
      }

      const key = buttonIdToFilterKey[this.id]
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

  // When reset filters clicked, this clears all filters, resets URL params and updates table
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

  // Toggles fetch frequency between 5 and 30 seconds, and changes message when using dropdowns
  $(document).on('mousedown', e => {
    isDropDownOpen = e.target.tagName.toLowerCase() === 'select'
    alertsUpdateFrequencyMessage(isDropDownOpen)
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

function alertsUpdateFrequencyMessage(isDropDownOpen) {
  const frequency = isDropDownOpen ? 30 : 5
  $('#alertsFetchStatus').empty()
  return $('#alertsFetchStatus').append(
    `<div class="govuk-inset-text">Alerts are being updated every <strong>${frequency}</strong> seconds</div>`,
  )
}

// Refreshes data if stale - when 30 seconds old
function isDataThirtySecondsOld(timer) {
  if (timer >= 25) {
    // next interval will tick at 30 seconds
    return { dataShouldRefresh: true, newTime: 0 }
  }
  return { dataShouldRefresh: false, newTime: timer + 5 }
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

// Checks all filters for each row, filtering out any false rows. Returns true (!false) where all filters match (or are empty)
function allFiltersChecker(filters) {
  return function (_settings, _data, _dataIndex, rowData) {
    return !(
      (filters.application && rowData.labels.application !== filters.application) ||
      (filters.environment && rowData.labels.environment !== filters.environment) ||
      (filters.namespace && rowData.labels.namespace !== filters.namespace) ||
      (filters.severity && rowData.labels.severity !== filters.severity) ||
      (filters.team && rowData.labels.team !== filters.team)
    )
  }
}

// Filters alerts data by dropdowns, returning an array of matching rows. Used to dynamically update dropdown options
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
