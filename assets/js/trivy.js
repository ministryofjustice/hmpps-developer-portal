jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/components/${cleanColumnOutput(rowData.name)}">${cleanColumnOutput(rowData.name)}</a>`)
      },
    },
    {
      data: 'title',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${cleanColumnOutput(rowData.title)}`)
      },
    },
    {
      data: 'lastScan',
      createdCell: function (td, _cellData, rowData) {
        const date = new Date(rowData.lastScan)
        const formattedDate = date.toLocaleString('en-GB', { timeZone: 'UTC' })
        $(td).html(formattedDate)
      },
    },
    {
      data: 'vulnerability',
      createdCell: function (td, _cellData, rowData) {
        if (rowData.primaryUrl) {
          $(td).html(`<a href="${rowData.primaryUrl}" target="_blank">${cleanColumnOutput(rowData.vulnerability)}</a>`)
        } else {
          $(td).html(`${cleanColumnOutput(rowData.vulnerability)}`)
        }
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
        $(td).html(rowData.references)
      },
    },
  ]

  createTable({ id: 'trivyTable', ajaxUrl: '/reports/trivy/data', orderColumn: 2, orderType: 'desc', columns })
})
