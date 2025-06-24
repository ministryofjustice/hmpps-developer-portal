const applicationFilter = document.getElementById('application')
const environmentFilter = document.getElementById('environment')
const namespaceFilter = document.getElementById('namespace')
const severityFilter = document.getElementById('severity')
const teamFilter = document.getElementById('team')

let isDropDownOpen = false

jQuery(async function () {
  alertsUpdateFrequencyMessage()
  // check url to see if any filters are currently applied
  let currentFilters = getFiltersFromURL()
  // get alerts from the api
  let alerts = await getAlerts()
  // is the alert data being refreshed?
  let isReset = false

  // use filters and alerts to update alert table and filters
  updateAll(alerts, currentFilters, isReset)
  // ensures first interval check for updateAlerts is a match so UI doesn't refresh after 5 seconds
  let previousDataJSON = alerts
  let timer = 0

  // Watch function updates Alerts on a timeout
  setInterval(async function () {
    const timerCheck = isDataThirtySecondsOld(timer)
    timer = timerCheck.timer
    result = timerCheck.result
    // Timer only starts ticking if a drop down is 'active'
    if (!isDropDownOpen || result) {
      alerts = await getAlerts()
      timer = 0
      previousDataJSON = updateAlerts(alerts, previousDataJSON, isReset)
    }
  }, 5000)
  // on click of any 'Update' button to apply filters
  $('#updateApplicationName,#updateEnvironment,#updateNamespace,#updateSeverityLabel,#updateTeam').on(
    'click',
    async e => {
      e.preventDefault(e)

      // check which filter has been updated
      let dropDownType = ''
      switch (e.target.id) {
        case 'updateApplicationName':
          dropDownType = 'application'
          break
        case 'updateEnvironment':
          dropDownType = 'environment'
          break
        case 'updateNamespace':
          dropDownType = 'namespace'
          break
        case 'updateTeam':
          dropDownType = 'team'
          break
        default:
          return false
      }
      // get the selectec dropdown option
      const dropDownText = $(`#${dropDownType} option:selected`).text()

      // update current filters
      currentFilters[`${dropDownType}`] = dropDownText
      // update alert table and filters
      isReset = false
      updateAll(alerts, currentFilters, isReset)
    },
  )

  // on click of 'Reset Filters' button, clear filters, reset url params and update table and filters
  $('#resetFilters').on('click', async e => {
    e.preventDefault(e)
    history.replaceState(null, '', '/alerts')
    currentFilters = {
      application: '',
      environment: '',
      namespace: '',
      severity: '',
      team: '',
    }
    isReset = true
    dropdownHandler.clearPendingValues()
    updateAll(alerts, currentFilters, isReset)
  })
})

const dropdownHandler = {
  // values for unapplied dropdowns
  pendingValues: {
    application: '',
    environment: '',
    namespace: '',
    severity: '',
    team: '',
  },
  clearPendingValues: function () {
    this.pendingValues = {
      application: '',
      environment: '',
      namespace: '',
      severity: '',
      team: '',
    }
  },
  updateDropdowns: function (filteredData, currentFilters, isReset) {
    const applications = this.getOptions(filteredData, 'application')
    const environments = this.getOptions(filteredData, 'environment')
    const namespaces = this.getOptions(filteredData, 'namespace')
    const severities = this.getOptions(filteredData, 'severity')
    const teams = this.getOptions(filteredData, 'team')

    this.renderDropdown(applicationFilter, applications, currentFilters.application, 'application', isReset)
    this.renderDropdown(environmentFilter, environments, currentFilters.environment, 'environment', isReset)
    this.renderDropdown(namespaceFilter, namespaces, currentFilters.namespace, 'namespace', isReset)
    this.renderDropdown(severityFilter, severities, currentFilters.severity, 'severity', isReset)
    this.renderDropdown(teamFilter, teams, currentFilters.team, 'team', isReset)
  },
  getOptions: function (data, key) {
    const set = new Set(data.map(a => a.labels[`${key}`]))
    return Array.from(set).sort()
  },
  removeOptions: function (selectElement) {
    Array.from(selectElement.options).forEach(() => {
      selectElement.remove(0)
    })
    const opt = document.createElement('option')
    opt.value = ''
    opt.textContent = ''
    selectElement.appendChild(opt)
  },
  renderDropdown: function (select, options, selectedValue, key, isReset) {
    this.pendingValues[key] = selectedValue === select.value ? '' : select.value
    //  clear dropDown options to prevent duplicates
    this.removeOptions(select)
    // append options
    options.forEach(option => {
      const newOption = document.createElement('option')
      newOption.value = option
      newOption.textContent = option
      newOption.selected = selectedValue !== '' ? option === selectedValue : option === this.pendingValues[key]
      select.appendChild(newOption)
    })
    if (isReset) {
      select.selectedIndex = 0
    }
  },
}

// gets alerts every 5 seconds
function updateAlerts(currentData, previousDataJSON, isReset) {
  //check against existing alerts
  if (currentData !== previousDataJSON) {
    const filters = getFiltersFromURL()
    isReset = false
    updateAll(currentData, filters, isReset)
  }
  return currentData
}

async function getAlerts() {
  const response = await fetch(`/alerts/all`)
  if (!response.ok) {
    throw new Error('There was a problem fetching the alert data')
  }
  return await response.json()
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

//  append tabledata to the #alertsStatusTable
function populateAlertTable(alerts) {
  const currentTime = new Date()
  const lastUpdatedTimestamp = formatTimeStamp(currentTime)
  try {
    $('#statusRows').empty()
    document.getElementById('lastUpdated').textContent = `Last updated: ${lastUpdatedTimestamp}`
    alerts.forEach(alert => {
      const startsAt = formatTimeStamp(new Date(alert.startsAt))
      // create links for alert urls
      const dashboardLink = alert.annotations.dashboard_url
        ? `<a href="${alert.annotations.dashboard_url}" class="statusTileHealth" target="_blank">Dashboard</a>`
        : ''
      const runbookLink = alert.annotations.runbook_url
        ? `<a href="${alert.annotations.runbook_url}" class="statusTileHealth" target="_blank">Runbook<a>`
        : ''
      const generatorLink = alert.generatorURL
        ? `<a href="${alert.generatorURL}" class="statusTileHealth" target="_blank">View</a>`
        : 'N/A'
      const slackLink = alert.labels.alert_slack_channel ? alert.labels.alert_slack_channel : 'N/A'
      $('#statusRows')
        .append(`<tr data-alert-name="${alert.labels.application}" data-environment="${alert.labels.application}" data-environment-type="${alert.labels.environment}" data-silenced="${alert.status.state}" id="tile-${alert.labels.application}-${alert.labels.environment}">
          <td>${alert.labels.alertname}</td>
          <td>${startsAt}</td>
          <td>${alert.annotations.message} </td>
          <td>${slackLink}</td>
          <td>${[dashboardLink, runbookLink, generatorLink].filter(link => link !== '').join(' ') || 'N/A'}</td>
        </tr>`)
    })
  } catch (e) {
    console.error(e)
  }
}

function populateAlertFilters(dropDownFilters) {
  dropDownFilters.forEach(filter => {
    filter.forEach(item => {
      const select = document.getElementById(`${item.type}`)
      select.add(new Option(item.text, item.text, false, item.selected))
    })
  })
}

// filter alters by selected filters
function applyFilters(alerts, filters) {
  return alerts.filter(
    alert =>
      (!filters.application || alert.labels.application === filters.application) &&
      (!filters.environment || alert.labels.environment === filters.environment) &&
      (!filters.namespace || alert.labels.namespace === filters.namespace) &&
      (!filters.severity || alert.labels.severity === filters.severity) &&
      (!filters.team || alert.labels.team === filters.team),
  )
}

// return false if no filter is selected
function isFiltersEmpty(filters) {
  return !filters.application && !filters.environment && !filters.namespace && !filters.severity && !filters.team
}

// update alert table, dropdowns and the url
function updateAll(alerts, currentFilters, isReset) {
  const filtered = applyFilters(alerts, currentFilters)
  populateAlertTable(filtered)
  // if no filters are selected populate dropdowns with all data, otherwise populate with an already filtered selection
  const dataForDropdowns = isFiltersEmpty(currentFilters) ? alerts : filtered
  dropdownHandler.updateDropdowns(dataForDropdowns, currentFilters, isReset)
  updateURLParams(currentFilters)
}

// Slows fetch frequency and changes message when user interacting with drop downs
// uses event listeners for instant change in UI when drop down open
document.addEventListener('mousedown', e => {
  if (e.target.tagName.toLowerCase() === 'select') {
    isDropDownOpen = true
    alertsUpdateFrequencyMessage()
  }
})

document.addEventListener('click', e => {
  if (e.target.tagName.toLowerCase() !== 'select') {
    isDropDownOpen = false
    alertsUpdateFrequencyMessage()
  }
})

// Refreshes data if stale - more than 30 seconds old
function isDataThirtySecondsOld(timer) {
  if (timer >= 25) {
    // next interval will tick at 30 seconds
    return { result: true, timer: 0 }
  }
  return { result: false, timer: timer + 5 }
}

// Message changes if drop down is open - from every 5 seconds to 30 seconds
function alertsUpdateFrequencyMessage() {
  const frequency = isDropDownOpen ? 30 : 5
  $('#alertsFetchStatus').empty()
  return $('#alertsFetchStatus').append(
    `<div class="govuk-inset-text">Alerts are being updated every <strong>${frequency}</strong> seconds!</div>`,
  )
}
