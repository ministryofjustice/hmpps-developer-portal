const teamFilter = document.getElementById('team')
const form = document.getElementById('veracodeForm')
const checkboxes = document.querySelectorAll('input[type="checkbox"]')

jQuery(function () {
  let currentFilters = getFiltersFromURL()

  if (isFiltersBlank(currentFilters)) {
    const failCheckbox = document.querySelector('input[name="results"][value="failed"]')
    if (failCheckbox) {
      failCheckbox.checked = true
      updateURLParams()
      currentFilters = getFiltersFromURL()
    }
  } else {
    team.value = currentFilters.team
    confirmCheckboxes(currentFilters)
  }
  let newDataUrl = updateURLParams()

  confirmCheckboxes(currentFilters)

  // const rootDataUrl = '/veracode/data'
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
    ajaxUrl: `${newDataUrl}`,
    orderColumn: 6,
    orderType: 'desc',
    columns,
  })

  veracodeTable.on('xhr', function (_e, settings, json) {
    const rawData = Array.isArray(json) ? json : json.data || []

    if (!rawData || !rawData.length) return

    populateTeamDropdown(rawData)

    currentFilters = getFiltersFromURL()
    confirmCheckboxes(currentFilters)

    // Register team filter function
    $.fn.dataTable.ext.search = []
    $.fn.dataTable.ext.search.push(teamFilterFunction(currentFilters))
    veracodeTable.draw()
  })

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
    return function (_settings, _data, _dataIndex, rowData) {
      if (filters.team && rowData.team !== filters.team) return false
      return true
    }
  }

  $(
    '#updateTeam,.environments .govuk-checkboxes__input,.status .govuk-checkboxes__input,.area .govuk-checkboxes__input',
  ).on('click change', e => {
    e.preventDefault()
    newDataUrl = updateURLParams()
    currentFilters = getFiltersFromURL()
    veracodeTable.ajax.url(newDataUrl).load(() => {
      $.fn.dataTable.ext.search = []
      $.fn.dataTable.ext.search.push(teamFilterFunction(currentFilters))
      veracodeTable.draw()
    })
  })
})

function isFiltersBlank(currentfilters) {
  return currentfilters.team === '' && currentfilters.results.length === 0 && currentfilters.exemption.length === 0
}

// function checks url params for applied filters and builds filter object
function getFiltersFromURL() {
  const params = new URLSearchParams(location.search)
  return {
    team: params.get('team') || '',
    results: params.get('results') ? params.get('results').split(',') : [],
    exemption: params.get('exemption') ? params.get('exemption').split(',') : [],
  }
}

// add current filters to Url params
function updateURLParams() {
  const newParams = new URLSearchParams()

  const selectedTeamFilter = teamFilter.value
  if (selectedTeamFilter) newParams.set('team', selectedTeamFilter)

  const selectedResultFilters = []
  const selectedExemptionFilters = []

  $('input:checkbox[name=results]:checked').each(function () {
    selectedResultFilters.push($(this).val())
  })

  $('input:checkbox[name=exemption]:checked').each(function () {
    selectedExemptionFilters.push($(this).val())
  })

  if (selectedResultFilters.length) newParams.set('results', selectedResultFilters.join(','))

  if (selectedExemptionFilters.length) newParams.set('exemption', selectedExemptionFilters.join(','))

  const newUrl = `${window.location.pathname}?${newParams.toString()}`
  window.history.replaceState({}, '', newUrl)

  const ajaxParams = new URLSearchParams()
  if (selectedResultFilters.length) ajaxParams.set('results', selectedResultFilters.join(','))
  if (selectedExemptionFilters.length) ajaxParams.set('exemption', selectedExemptionFilters.join(','))

  const newDataUrl = `/veracode/data?${ajaxParams.toString()}`

  return newDataUrl
}

function confirmCheckboxes(currentFilters) {
  checkboxes.forEach(checkbox => {
    const { name, value } = checkbox
    if (
      (name === 'results' && currentFilters.results.includes(value)) ||
      (name === 'exemption' && currentFilters.exemption.includes(value))
    ) {
      checkbox.checked = true
    } else {
      checkbox.checked = false
    }
  })
}
