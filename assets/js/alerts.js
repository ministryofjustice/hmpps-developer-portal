const applicationFilter = document.getElementById('application')
const environmentFilter = document.getElementById('environment')
const namespaceFilter = document.getElementById('namespace')
const severityFilter = document.getElementById('severity')

jQuery(async function () {
  // check url to see if any filters are currently applied
  let currentFilters = getFiltersFromURL()
  // get alerts from the api
  let alerts = await getAlerts()
  // is the alert data being refreshed?
  let isReset = false

  // use filters and alerts to update alert table and filters
  updateAll(alerts, currentFilters, isReset)

  let previousDataJSON

  // Watch function updates Alerts on a timeout
  setInterval(async function () {
    alerts = await getAlerts()
    previousDataJSON = updateAlerts(alerts, previousDataJSON, isReset)
  }, 5000)
  // on click of any 'Update' button to apply filters
  $('#updateApplicationName,#updateEnvironment,#updateNamespace,#updateSeverityLabel').on('click', async e => {
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
      case 'updateSeverityLabel':
        dropDownType = 'severity'
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
  })

  // on click of 'Reset Filters' button, clear filters, reset url params and update table and filters
  $('#resetFilters').on('click', async e => {
    e.preventDefault(e)
    history.replaceState(null, '', '/alerts')
    currentFilters = {
      application: '',
      environment: '',
      namespace: '',
      severity: '',
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
  },
  clearPendingValues: function () {
    this.pendingValues = {
      application: '',
      environment: '',
      namespace: '',
      severity: '',
    }
  },
  updateDropdowns: function (filteredData, currentFilters, isReset) {
    // Get dynamic options from filtered data
    const applications = this.getOptions(filteredData, 'application')
    // Don't rebuild the environments dropdown - preserve server-side canonical environments
    // const environments = this.getOptions(filteredData, 'environment')
    const namespaces = this.getOptions(filteredData, 'namespace')
    const severities = this.getOptions(filteredData, 'severity')

    this.renderDropdown(applicationFilter, applications, currentFilters.application, 'application', isReset)
    // Skip environment dropdown rebuilding - only update selected value
    this.updateSelectedValue(environmentFilter, currentFilters.environment, 'environment', isReset)
    this.renderDropdown(namespaceFilter, namespaces, currentFilters.namespace, 'namespace', isReset)
    this.renderDropdown(severityFilter, severities, currentFilters.severity, 'severity', isReset)
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
    // if there is a value pending apply that on click
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
  updateSelectedValue: function (select, selectedValue, key, isReset) {
    // Only update selection without rebuilding the dropdown
    if (isReset) {
      select.selectedIndex = 0
      this.pendingValues[key] = ''
      return
    }

    if (selectedValue) {
      // Find and select the option that matches the selectedValue
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === selectedValue) {
          select.selectedIndex = i
          break
        }
      }
    } else if (this.pendingValues[key]) {
      // Or select based on pending value
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === this.pendingValues[key]) {
          select.selectedIndex = i
          break
        }
      }
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

// async function getEnvironments() {
//   const response = await fetch(`/alerts/environments`)
//   if (!response.ok) {
//     throw new Error('There was a problem fetching the alert data')
//   }
//   return await response.json()
// }

// add current filters to Url params
function updateURLParams(filters) {
  const params = new URLSearchParams()
  if (filters.application.length) params.set('application', filters.application)
  if (filters.environment) params.set('environment', filters.environment)
  if (filters.namespace) params.set('namespace', filters.namespace)
  if (filters.severity) params.set('severity', filters.severity)
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
  }
}

//  append tabledata to the #statusTable
function populateAlertTable(alerts) {
  try {
    $('#statusRows').empty()
    alerts.forEach(alert => {
      //create links for alert urls
      const dashboardLink = alert.annotations.dashboard_url
        ? `<a href="${alert.annotations.dashboard_url}" class="statusTileHealth" target="_blank">View</a>`
        : 'N/A'
      const runbookLink = alert.annotations.runbook_url
        ? `<a href="${alert.annotations.runbook_url}" class="statusTileHealth" target="_blank">View</a>`
        : 'N/A'
      const generatorLink = alert.generatorURL
        ? `<a href="${alert.generatorURL}" class="statusTileHealth" target="_blank">View</a>`
        : 'N/A'
      $('#statusRows')
        .append(`<tr data-alert-name="${alert.labels.application}" data-environment="${alert.labels.application}" data-environment-type="${alert.labels.environment}" id="tile-${alert.labels.application}-${alert.labels.environment}">
          <td>${alert.labels.alertname}</td>
          <td>${alert.annotations.message} </td>
          <td>${dashboardLink}</td>
          <td>${runbookLink} </td>
          <td>${generatorLink}</td>
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
      (!filters.severity || alert.labels.severity === filters.severity),
  )
}

// return false if no filter is selected
function isFiltersEmpty(filters) {
  return !filters.application && !filters.environment && !filters.namespace && !filters.severity
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
