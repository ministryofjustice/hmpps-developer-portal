jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/service-areas/${rowData.slug}">${rowData.name}</a>`)
      },
    },
    {
      data: 'owner',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.owner}`)
      },
    },
    {
      data: 'products',
      render: createSearchableProductList,
    },
  ]

  createTable({
    id: 'serviceAreasTable',
    ajaxUrl: '/service-areas/data',
    orderColumn: 0,
    orderType: 'asc',
    columns,
    pageLength: 25,
  })
})
