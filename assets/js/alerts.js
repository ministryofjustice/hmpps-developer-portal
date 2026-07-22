import { createTable } from './common.js'

function alertsUpdateFrequencyMessage(isSlowMode) {
  const frequency = isSlowMode ? 30 : 5
  $('#alertsFetchStatus').empty()
  return $('#alertsFetchStatus').append(
    `<div class="govuk-inset-text">Alerts are being updated every <strong>${frequency}</strong> seconds</div>`,
  )
}

function isDataThirtySecondsOld(timer) {
  if (timer >= 25) {
    return { dataShouldRefresh: true, newTime: 0 }
  }
  return { dataShouldRefresh: false, newTime: timer + 5 }
}

function lastUpdatedTime() {
  const currentTime = new Date()
  const lastUpdatedTimestamp = formatTimeStamp(currentTime)
  document.getElementById('lastUpdated').textContent = `Last updated: ${lastUpdatedTimestamp}`
}

function getFiltersFromURL() {
  const params = new URLSearchParams(location.search)
  return {
    application: params.get('application') || '',
    environment: params.get('environment') || '',
    namespace: params.get('namespace') || '',
    severity: params.get('severity') || '',
    team: params.get('team') || '',
    portfolio: params.get('portfolio') || '',
  }
}

function updateURLParams(filters) {
  const params = new URLSearchParams()
  if (filters.application.length) params.set('application', filters.application)
  if (filters.environment) params.set('environment', filters.environment)
  if (filters.namespace) params.set('namespace', filters.namespace)
  if (filters.severity) params.set('severity', filters.severity)
  if (filters.team) params.set('team', filters.team)
  if (filters.portfolio) params.set('portfolio', filters.portfolio)

  history.replaceState(null, '', `?${params.toString()}`)
}

function allFiltersChecker(filters) {
  return function (_settings, _data, _dataIndex, rowData) {
    return !(
      (filters.application && rowData.labels.application !== filters.application) ||
      (filters.environment && rowData.labels.environment !== filters.environment) ||
      (filters.namespace && rowData.labels.namespace !== filters.namespace) ||
      (filters.severity && rowData.labels.severity !== filters.severity) ||
      (filters.team && rowData.labels.team !== filters.team) ||
      (filters.portfolio && rowData.labels.portfolio !== filters.portfolio)
    )
  }
}

function getFilteredData(data, filters) {
  return data.filter(
    rowData =>
      (!filters.application || rowData.labels.application === filters.application) &&
      (!filters.environment || rowData.labels.environment === filters.environment) &&
      (!filters.namespace || rowData.labels.namespace === filters.namespace) &&
      (!filters.severity || rowData.labels.severity === filters.severity) &&
      (!filters.team || rowData.labels.team === filters.team) &&
      (!filters.portfolio || rowData.labels.portfolio === filters.portfolio),
  )
}

function filterOrResetDropdowns(alertsData, currentFilters, { isReset = true }) {
  let selectedItems = {}
  let firstKeySelected = ''
  if (!isReset) {
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value.length > 0) {
        selectedItems[key] = value
      }
      const [firstKey, firstValue] = Object.entries(selectedItems)[0] ?? []
      const changedFilterKey = firstKey ? { [firstKey]: firstValue } : {}
      firstKeySelected = Object.keys(changedFilterKey)[0]
    })
  } else {
    selectedItems = {}
  }
  const filteredData = getFilteredData(alertsData, currentFilters)

  const keys = ['application', 'environment', 'namespace', 'severity', 'team', 'portfolio']
  keys.forEach(key => populateAlertsDropdowns(filteredData, key, currentFilters, firstKeySelected))
}

function populateAlertsDropdowns(data, key, currentFilters, firstKeySelected) {
  if (key === firstKeySelected) return
  const allOptions = [...new Set(data.map(a => a.labels[`${key}`]))].sort()

  const $dropdownSelect = $(`#${key}`)
  $dropdownSelect.empty().append('<option value=""></option>')

  allOptions.forEach(option => {
    $dropdownSelect.append(`<option value="${option}">${option}</option>`)
  })

  if (currentFilters[`${key}`]) {
    $dropdownSelect.val(currentFilters[`${key}`])
  }
}

function formatTimeStamp(dateString) {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) throw new Error('Invalid date')
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

if (document.querySelector('#alertsTable')) {
  jQuery(function () {
    const applicationFilter = document.getElementById('application')
    const environmentFilter = document.getElementById('environment')
    const namespaceFilter = document.getElementById('namespace')
    const severityFilter = document.getElementById('severity')
    const teamFilter = document.getElementById('team')
    const portfolioFilter = document.getElementById('portfolio')

    let currentFilters = getFiltersFromURL()
    let alertsData = []
    let isDropDownOpen = false
    let isPaginationActive = false
    let timer = 0

    const columns = [
      {
        data: 'labels.alertname',
        createdCell: function (td, _cellData, rowData) {
          $(td).html(rowData.labels.alertname ? `${rowData.labels.alertname}` : 'N/A')
        },
      },
      {
        data: 'startsAt',
        createdCell: function (td, _cellData, rowData) {
          const startsAt = rowData.startsAt ? formatTimeStamp(rowData.startsAt) : 'N/A'
          $(td).html(`${startsAt}`)
        },
      },
      {
        data: 'annotations.message',
        createdCell: function (td, _cellData, rowData) {
          $(td).html(rowData.annotations.message ? `${rowData.annotations.message}` : 'N/A')
        },
      },
      {
        data: 'labels.application',
        createdCell: function (td, _cellData, rowData) {
          $(td).html(rowData.labels.application ? `${rowData.labels.application}` : 'N/A')
        },
      },
      {
        data: 'labels.alert_slack_channel',
        defaultContent: 'N/A',
        createdCell: function (td, _cellData, rowData) {
          const slackName = rowData.labels.alert_slack_channel || 'N/A'
          const slackNameNoHashtag = slackName.slice(1)
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

    setInterval(function () {
      const slowMode = isDropDownOpen || isPaginationActive
      const { newTime, dataShouldRefresh } = isDataThirtySecondsOld(timer)
      timer = newTime

      if (!slowMode || dataShouldRefresh) {
        alertsTable.ajax.reload(null, false)
        timer = 0
        lastUpdatedTime()
      }
    }, 5000)

    lastUpdatedTime()
    alertsUpdateFrequencyMessage(isDropDownOpen)

    alertsTable.on('xhr', function (_e, settings, json) {
      $('#alertsErrorStatus').empty()

      alertsData = Array.isArray(json) ? json : json.data || []
      if (!alertsData || !alertsData.length) return

      filterOrResetDropdowns(alertsData, currentFilters, { isReset: false })

      $.fn.dataTable.ext.search = []
      $.fn.dataTable.ext.search.push(allFiltersChecker(currentFilters))
      alertsTable.draw(false)
    })

    $('#updateApplicationName,#updateEnvironment,#updateNamespace,#updateSeverityLabel,#updateTeam,#updatePortfolio').on(
      'click',
      function (e) {
        e.preventDefault()

        const buttonIdToFilterKey = {
          updateApplicationName: 'application',
          updateEnvironment: 'environment',
          updateNamespace: 'namespace',
          updateSeverityLabel: 'severity',
          updateTeam: 'team',
          updatePortfolio: 'portfolio',
        }

        const key = buttonIdToFilterKey[this.id]
        if (!key) return

        currentFilters[key] = $(`#${key}`).val()

        updateURLParams(currentFilters)

        $.fn.dataTable.ext.search = []
        $.fn.dataTable.ext.search.push(allFiltersChecker(currentFilters))
        alertsTable.draw(false)
        filterOrResetDropdowns(alertsData, currentFilters, { isReset: false })
      },
    )

    $('#resetFilters').on('click', function (e) {
      e.preventDefault()
      currentFilters = {
        application: '',
        environment: '',
        namespace: '',
        severity: '',
        team: '',
        portfolio: '',
      }
      $('#application,#environment,#namespace,#severity,#team,#portfolio').val('')
      updateURLParams(currentFilters)
      $.fn.dataTable.ext.search = []
      alertsTable.draw(false)
      filterOrResetDropdowns(alertsData, currentFilters, { isReset: true })
    })

    $(document).on('mousedown', e => {
      isDropDownOpen = $(e.target).is('select')
      isPaginationActive = $(e.target).closest('.dt-paging-button').length > 0
      alertsUpdateFrequencyMessage(isDropDownOpen || isPaginationActive)
    })
  })
}
