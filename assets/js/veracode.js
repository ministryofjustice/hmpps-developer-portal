jQuery(function () {
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
})
