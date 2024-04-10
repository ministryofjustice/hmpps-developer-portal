function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  const rootDataUrl = '/components/veracode/data'

  const veracodeTable = new DataTable('#veracodeTable', {
    lengthMenu: [
      [10, 25, 50, 75, 100, -1],
      [10, 25, 50, 75, 100, 'All'],
    ],
    paging: true,
    pagingType: 'simple_numbers',
    order: [[6, 'desc']],
    sortable: true,
    ajax: {
      url: `${rootDataUrl}?results=failed`,
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading components.') // eslint-disable-line no-undef
      },
    },
    columns: [
      {
        data: 'name',
        createdCell: function (td, cellData, rowData) {
          $(td).html(`<a href="/components/${cleanColumnOutput(rowData.name)}">${cleanColumnOutput(rowData.name)}</a>`)
        },
      },
      {
        data: 'result',
        createdCell: function (td, cellData, rowData) {
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
        createdCell: function (td, cellData, rowData) {
          $(td).html(`${rowData.date}`).addClass('td-nowrap')
        },
      },
      {
        data: 'severityLevels.VERY_HIGH',
        createdCell: function (td, cellData, rowData) {
          const data = rowData.hasVeracode ? rowData.severityLevels.VERY_HIGH : 'N/A'
          $(td).html(data)
        },
      },
      {
        data: 'severityLevels.HIGH',
        createdCell: function (td, cellData, rowData) {
          const data = rowData.hasVeracode ? rowData.severityLevels.HIGH : 'N/A'
          $(td).html(data)
        },
      },
      {
        data: 'severityLevels.MEDIUM',
        createdCell: function (td, cellData, rowData) {
          const data = rowData.hasVeracode ? rowData.severityLevels.MEDIUM : 'N/A'
          $(td).html(data)
        },
      },
      {
        data: 'severityLevels.LOW',
        createdCell: function (td, cellData, rowData) {
          const data = rowData.hasVeracode ? rowData.severityLevels.LOW : 'N/A'
          $(td).html(data)
        },
      },
      {
        data: 'codeScore',
        createdCell: function (td, cellData, rowData) {
          const data = rowData.hasVeracode ? rowData.codeScore : 0
          $(td).html(data)
        },
        type: 'num',
      },
      {
        data: 'report',
        createdCell: function (td, cellData, rowData) {
          const data = rowData.hasVeracode ? `<a href="${rowData.report}" target="_blank">View</a>` : 'N/A'
          $(td).html(data)
        },
      },
    ],
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

    const newDataUrl = `${rootDataUrl}?results=${selectedResultFilters.join(',')}&exemption=${selectedExemptionFilters.join(',')}`

    veracodeTable.ajax.url(newDataUrl).load()
  })
})
