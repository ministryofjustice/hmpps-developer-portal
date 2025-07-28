const teamFilter = document.getElementById('team')
const form = document.getElementById('veracodeForm')
const checkboxes = document.querySelectorAll('input[type="checkbox"]')

let currentFilters = {}

jQuery(function () {
  currentFilters = getFiltersFromURL()

  // If no filters on load, default to 'failed' results
  if (areFiltersBlank(currentFilters)) {
    const failCheckbox = document.querySelector('input[name="results"][value="failed"]')
    if (failCheckbox) failCheckbox.checked = true
    currentFilters = getFiltersFromUI()
    updateURLParams(currentFilters)
  } else {
    teamFilter.value = currentFilters.team
    setCheckboxes(currentFilters)
  }
  const rootDataUrl = buildAjaxUrl(currentFilters)

  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/components/${cleanColumnOutput(rowData.name)}">${cleanColumnOutput(rowData.name)}</a>`)
      },
    },
    {
      data: 'result',
      createdCell: function (td, _cellData, rowData) {
        let className = 'veracode--missing'
        let data = 'N/A'

        if (rowData.hasVeracode) {
          className = rowData.result === 'Passed' ? 'veracode--passed' : 'veracode--failed'
          data = rowData.result
        }

        $(td).html(data).addClass(className)
      },
    },
    {
      data: 'date',
      title: 'Date',
      className: 'td-nowrap',
      render: function (data, type) {
        if (type === 'display' || type === 'filter') {
          return data || ''
        }
        // sort: use timestamp
        return Date.parse(data) || 0
      },
    },
    {
      data: 'severityLevels.VERY_HIGH',
      title: 'Very High',
      type: 'num',
      render: function (data, type, row) {
        const val = row.hasVeracode ? data : 0
        if (type === 'display' || type === 'filter') {
          return row.hasVeracode ? data : 'N/A'
        }
        return val
      },
    },
    {
      data: 'severityLevels.HIGH',
      title: 'High',
      type: 'num',
      render: function (data, type, row) {
        const val = row.hasVeracode ? data : 0
        if (type === 'display' || type === 'filter') {
          return row.hasVeracode ? data : 'N/A'
        }
        return val
      },
    },
    {
      data: 'severityLevels.MEDIUM',
      title: 'Medium',
      type: 'num',
      render: function (data, type, row) {
        const val = row.hasVeracode ? data : 0
        if (type === 'display' || type === 'filter') {
          return row.hasVeracode ? data : 'N/A'
        }
        return val
      },
    },
    {
      data: 'severityLevels.LOW',
      title: 'Low',
      type: 'num',
      render: function (data, type, row) {
        const val = row.hasVeracode ? data : 0
        if (type === 'display' || type === 'filter') {
          return row.hasVeracode ? data : 'N/A'
        }
        return val
      },
    },
    {
      data: 'codeScore',
      createdCell: function (td, _cellData, rowData) {
        const data = rowData.hasVeracode ? rowData.codeScore : 0
        $(td).html(data)
      },
      type: 'num',
    },
    {
      data: 'report',
      createdCell: function (td, _cellData, rowData) {
        const data = rowData.hasVeracode ? `<a href="${rowData.report}" target="_blank">View</a>` : 'N/A'
        $(td).html(data)
      },
    },
  ]

  const veracodeTable = createTable({
    id: 'veracodeTable',
    ajaxUrl: `${rootDataUrl}`,
    orderColumn: 6,
    orderType: 'desc',
    columns,
  })

  veracodeTable.on('xhr', function (_e, settings, json) {
    const rawData = Array.isArray(json) ? json : json.data || []
    if (!rawData || !rawData.length) return

    populateTeamDropdown(rawData)
    setCheckboxes(currentFilters)

    $.fn.dataTable.ext.search.push(teamFilterFunction(currentFilters))
    veracodeTable.draw()
  })

  // On dropdown update or checkbox change
  $(
    '#updateTeam,.environments .govuk-checkboxes__input,.status .govuk-checkboxes__input,.area .govuk-checkboxes__input',
  ).on('click change', e => {
    e.preventDefault()
    //newDataUrl = updateURLParams()
    currentFilters = getFiltersFromUI()
    updateURLParams(currentFilters)
    const newDataUrl = buildAjaxUrl(currentFilters)
    veracodeTable.ajax.url(newDataUrl).load(() => {
      $.fn.dataTable.ext.search = [teamFilterFunction(currentFilters)]
      veracodeTable.draw()
    })
  })
})

// function checks url params for applied filters and builds filter object
function getFiltersFromURL() {
  const params = new URLSearchParams(location.search)
  return {
    team: params.get('team') || '',
    results: params.get('results') ? params.get('results').split(',') : [],
    exemption: params.get('exemption') ? params.get('exemption').split(',') : [],
  }
}

function populateTeamDropdown(data) {
  const teams = [...new Set(data.map(item => item.team))].sort()
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
  return filters.team && rowData.team !== filters.team
}

function getFiltersFromUI() {
  const results = $('input:checkbox[name=results]:checked').map(checkbox => checkbox.val())

  const exemption = $('input:checkbox[name=exemption]:checked').map(checkbox => checkbox.val())

  return {
    team: teamFilter.value,
    results,
    exemption,
  }
}

// Add current filters to Url params
function updateURLParams(currentFilters) {
  const newParams = new URLSearchParams()

  if (currentFilters.team) newParams.set('team', currentFilters.team)
  if (currentFilters.results.length) newParams.set('results', currentFilters.results.join(','))
  if (currentFilters.exemption.length) newParams.set('exemption', currentFilters.exemption.join(','))

  const newUrl = `${window.location.pathname}?${newParams.toString()}`
  window.history.replaceState({}, '', newUrl)
}

function buildAjaxUrl(currentFilters) {
  const params = new URLSearchParams()
  if (currentFilters.results.length) params.set('results', currentFilters.results.join(','))
  if (currentFilters.exemption.length) params.set('exemption', currentFilters.exemption.join(','))
  return `/veracode/data?${params.toString()}`
}

function setCheckboxes(currentFilters) {
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    const { name, value } = checkbox
    checkbox.checked =
      (name === 'results' && currentFilters.results.includes(value)) ||
      (name === 'exemption' && currentFilters.exemption.includes(value))
  })
}

function areFiltersBlank(currentfilters) {
  return currentfilters.team === '' && currentfilters.results.length === 0 && currentfilters.exemption.length === 0
}
