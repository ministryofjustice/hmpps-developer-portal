const teamFilter = document.getElementById('team')

jQuery(function () {
  let currentFilters = getFiltersFromURL()

  const rootDataUrl = '/veracode/data'
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
    ajaxUrl: `${rootDataUrl}?results=failed`,
    orderColumn: 6,
    orderType: 'desc',
    columns,
  })

  veracodeTable.on('xhr', function (_e, settings, json) {
    const rawData = Array.isArray(json) ? json : json.data || []

    if (!rawData || !rawData.length) return

    populateTeamDropdown(rawData)

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

  $('.environments .govuk-checkboxes__input,.status .govuk-checkboxes__input,.area .govuk-checkboxes__input').on(
    'change',
    e => {
      e.preventDefault(e)
      const selectedResultFilters = []
      const selectedExemptionFilters = []

      $('input:checkbox[name=results]:checked').each(function () {
        selectedResultFilters.push($(this).val())
      })

      $('input:checkbox[name=exemption]:checked').each(function () {
        selectedExemptionFilters.push($(this).val())
      })

      const newDataUrl = `${rootDataUrl}?results=${selectedResultFilters.join(',')}&exemption=${selectedExemptionFilters.join(',')}`

      veracodeTable.ajax.url(newDataUrl).load()
    },
  )

  $('#updateTeam').on('click', function (e) {
    e.preventDefault()

    const selectedTeam = $('#team').val()
    currentFilters.team = selectedTeam

    // Update URL without reload
    updateURLParams(currentFilters)

    // Reapply filter
    $.fn.dataTable.ext.search = []
    $.fn.dataTable.ext.search.push(teamFilterFunction(currentFilters))
    veracodeTable.draw(false)
  })
})

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
