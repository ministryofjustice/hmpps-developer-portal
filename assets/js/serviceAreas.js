jQuery(function () {
  const columns = [
    {
      data: 'attributes.name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/service-areas/${rowData.attributes.slug}">${rowData.attributes.name}</a>`)
      },
    },
  ]

  createTable('serviceAreasTable', '/service-areas/data', 0, 'asc', columns, 25)
})
