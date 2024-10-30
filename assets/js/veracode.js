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
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.date}`).addClass('td-nowrap')
      },
    },
    {
      data: 'severityLevels.VERY_HIGH',
      createdCell: function (td, _cellData, rowData) {
        const data = rowData.hasVeracode ? rowData.severityLevels.VERY_HIGH : 'N/A'
        $(td).html(data)
      },
    },
    {
      data: 'severityLevels.HIGH',
      createdCell: function (td, _cellData, rowData) {
        const data = rowData.hasVeracode ? rowData.severityLevels.HIGH : 'N/A'
        $(td).html(data)
      },
    },
    {
      data: 'severityLevels.MEDIUM',
      createdCell: function (td, _cellData, rowData) {
        const data = rowData.hasVeracode ? rowData.severityLevels.MEDIUM : 'N/A'
        $(td).html(data)
      },
    },
    {
      data: 'severityLevels.LOW',
      createdCell: function (td, _cellData, rowData) {
        const data = rowData.hasVeracode ? rowData.severityLevels.LOW : 'N/A'
        $(td).html(data)
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

  $('#updateVeracodeFilters').on('click', async e => {
    e.preventDefault(e)
    const selectedResultFilters = []
    const selectedExemptionFilters = []

    $('input:checkbox[name=results]:checked').each(function () {
      selectedResultFilters.push($(this).val())
    })

    $('input:checkbox[name=exemption]:checked').each(function () {
      selectedExemptionFilters.push($(this).val())
    })
    console.log(
      `${rootDataUrl}?results=${selectedResultFilters.join(',')}&exemption=${selectedExemptionFilters.join(',')}`,
    )
    const newDataUrl = `${rootDataUrl}?results=${selectedResultFilters.join(',')}&exemption=${selectedExemptionFilters.join(',')}`

    veracodeTable.ajax.url(newDataUrl).load()
  })
})
