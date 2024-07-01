jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/components/${cleanColumnOutput(rowData.name)}">${cleanColumnOutput(rowData.name)}</a>`)
      },
    },
    {
      data: 'lastScan',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${cleanColumnOutput(rowData.lastScan)}`)
      },
    },
    {
      data: 'vulnerability',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${cleanColumnOutput(rowData.vulnerability)}`)
      },
    },
    {
      data: 'severity',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${cleanColumnOutput(rowData.severity)}`)
      },
    },
    {
      data: 'references',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${cleanColumnOutput(rowData.references)}`)
      },
    },
  ]

  createTable('trivyTable', '/components/trivy/data', 2, 'desc', columns)
})
