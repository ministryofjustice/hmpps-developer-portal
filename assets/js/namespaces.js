jQuery(function () {
  const columns = [
    {
      data: 'attributes.name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/namespaces/${rowData.attributes.name}">${rowData.attributes.name}</a>`)
      },
    },
  ]

  createTable('namespacesTable', '/namespaces/data', 0, 'asc', columns)
})
