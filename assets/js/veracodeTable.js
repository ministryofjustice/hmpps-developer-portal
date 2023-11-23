function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  $('#veracodeTable').DataTable({
    lengthMenu: [
      [10, 25, 50, 75, 100, -1],
      [10, 25, 50, 75, 100, 'All'],
    ],
    paging: true,
    order: [[6, 'desc']],
    sortable: true,
    ajax: {
      url: '/components/veracode/data',
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
})
