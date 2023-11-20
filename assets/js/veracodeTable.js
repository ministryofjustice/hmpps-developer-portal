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
    order: [[0, 'asc']],
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
        data: 'pass',
        createdCell: function (td, cellData, rowData) {
          const data = rowData.hasVeracode ? rowData.pass : 'N/A'
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
        data: 'report',
        createdCell: function (td, cellData, rowData) {
          const data = rowData.hasVeracode ? `<a href="${rowData.report}" target="_blank">View</a>` : 'N/A'
          $(td).html(data)
        },
      },
    ],
  })
})
