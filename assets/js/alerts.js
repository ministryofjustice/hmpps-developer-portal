const applicationFilter = document.getElementById('application')
const environmentFilter = document.getElementById('environment')
const namespaceFilter = document.getElementById('namespace')
const severityFilter = document.getElementById('severity')
let previousDataJSON = ''

jQuery(async function () {
  let currentFilters = getFiltersFromURL()
  const alerts = await getAlerts()
  updateAll(alerts, currentFilters)

  $('#updateApplicationName,#updateEnvironment,#updateNamespace,#updateSeverityLabel').on('click', async e => {
    e.preventDefault(e)

    // let dropDownType = ''
    // console.log('JS even.target.id: ', e.target.id)
    // switch (e.target.id) {
    //   case 'updateApplicationName':
    //     dropDownType = 'application'
    //     break
    //   case 'updateEnvironment':
    //     dropDownType = 'environment'
    //     break
    //   case 'updateNamespace':
    //     dropDownType = 'namespace'
    //     break
    //   case 'updateSeverityLabel':
    //     dropDownType = 'severity'
    //     break
    //   default:
    //     return false
    // }
    // const dropDownText = $(`#${dropDownType} option:selected`).text()

    // currentFilters[`${dropDownType}`] = dropDownText
    // console.log('currentFilters: ', currentFilters)
    updateAll(alerts, currentFilters)

    // Watch function updates Alerts on a timeout
    watch()
  })

  $('#resetFilters').on('click', async e => {
    const params = new URLSearchParams()
    history.replaceState(null, '', '/alerts')
    currentFilters = {
      application: '',
      environment: '',
      namespace: '',
      severity: '',
    }
    updateDropdowns(alerts, currentFilters)
    updateAll(alerts, currentFilters)
  })
  //await populateAlertTable()
})

const watch = async () => {
  await updateAlerts()

  setTimeout(watch, 50000)
}

const updateAlerts = async () => {
  try {
    const currentData = await getAlerts() // Replace with your actual API URL

    if (currentData !== previousDataJSON) {
      alerts = currentData
      previousDataJSON = currentData
      let filters = getFiltersFromURL()
      updateAll(currentData, filters)
    }
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
  }
}

async function getAlerts() {
  const response = await fetch(`/alerts/all`)
  if (!response.ok) {
    throw new Error('There was a problem fetching the alert data')
  }
  return await response.json()
}

function updateURLParams(filters) {
  const params = new URLSearchParams()
  if (filters.application.length) params.set('application', filters.application)
  if (filters.environment) params.set('environment', filters.environment)
  if (filters.namespace) params.set('namespace', filters.namespace)
  if (filters.severity) params.set('severity', filters.severity)
  history.replaceState(null, '', '?' + params.toString())
}

function getFiltersFromURL() {
  const params = new URLSearchParams(location.search)
  return {
    application: params.get('application') || '',
    environment: params.get('environment') || '',
    namespace: params.get('namespace') || '',
    severity: params.get('severity') || '',
  }
}

async function populateAlertTable(alerts) {
  try {
    $('#statusRows').empty()
    alerts.forEach(alert => {
      const alertLink = alert.annotations.dashboard_url
        ? `<a href="${alert.annotations.dashboard_url}" class="statusTileHealth" target="_blank">${alert.labels.alertname}</a>`
        : 'N/A'
      $('#statusRows')
        .append(`<tr data-alert-name="${alert.labels.application}" data-environment="${alert.labels.application}" data-environment-type="${alert.labels.environment}" id="tile-${alert.labels.application}-${alert.labels.environment}">
          <td>${alert.labels.application}</td>
          <td>${alert.labels.environment} </td>
          <td>${alert.labels.namespace}</td>
          <td class="statusTileBuild">${alert.labels.severity}</td>

        </tr>`)
    })

    /* watch() */
  } catch (e) {
    console.error(e)
  }
}

function getOptions(data, key) {
  const set = new Set(data.map(a => a.labels[`${key}`]))
  return Array.from(set).sort()
}

function removeOptions(selectElement) {
  var i,
    L = selectElement.options.length - 1
  for (i = L; i >= 0; i--) {
    selectElement.remove(i)
  }
  const opt = document.createElement('option')
  opt.value = ''
  opt.textContent = ''
  selectElement.appendChild(opt)
}

function renderDropdown(select, options, selectedValue, key) {
  removeOptions(select)
  if (selectedValue != '') {
    options.forEach(option => {
      const opt = document.createElement('option')
      opt.value = option
      opt.textContent = option
      if (option === selectedValue) opt.selected = true
      select.appendChild(opt)
    })
  } else {
    options.forEach(option => {
      const opt = document.createElement('option')
      opt.value = option
      opt.textContent = option
      select.appendChild(opt)
    })
  }
}

function populateAlertFilters(dropDownFilters) {
  console.log('dropDownFilters: ', dropDownFilters)
  dropDownFilters.forEach(filter => {
    filter.forEach(item => {
      let select = document.getElementById(`${item.type}`)
      select.add(new Option(item.text, item.text, false, item.selected))
    })
  })
}

function updateDropdowns(filteredData, currentFilters) {
  // Get dynamic options from filtered data
  const applications = getOptions(filteredData, 'application')
  const environments = getOptions(filteredData, 'environment')
  const namespaces = getOptions(filteredData, 'namespace')
  const severities = getOptions(filteredData, 'severity')

  renderDropdown(applicationFilter, applications, currentFilters.application, 'application')
  renderDropdown(environmentFilter, environments, currentFilters.environment, 'environment')
  renderDropdown(namespaceFilter, namespaces, currentFilters.namespace, 'namespace')
  renderDropdown(severityFilter, severities, currentFilters.severity, 'severity')
}

function applyFilters(alerts, filters) {
  return alerts.filter(alert => {
    if (filters.application && alert.labels.application !== filters.application) return false
    if (filters.environment && alert.labels.environment !== filters.environment) return false
    if (filters.namespace && alert.labels.namespace !== filters.namespace) return false
    if (filters.severity && alert.labels.severity !== filters.severity) return false
    return true
  })
}

function isFiltersEmpty(filters) {
  return !filters.application && !filters.environment && !filters.namespace && !filters.severity
}

function updateAll(alerts, currentFilters) {
  const filtered = applyFilters(alerts, currentFilters)
  populateAlertTable(filtered)
  const dataForDropdowns = isFiltersEmpty(currentFilters) ? alerts : filtered
  updateDropdowns(dataForDropdowns, currentFilters)
  updateURLParams(currentFilters)
}

function formatMonitorName(name) {
  return `${name} `
    .trim()
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^-a-z0-9]/g, '')
    .replace(/-+/g, '-')
}
