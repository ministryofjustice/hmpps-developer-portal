jQuery(function () {
  const columns = [
    {
      data: 'attributes.ps_id',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/product-sets/${rowData.id}">${rowData.attributes.ps_id}</a>`)
      },
    },
    {
      data: 'attributes.name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/product-sets/${rowData.id}">${rowData.attributes.name}</a>`)
      },
    },
  ]

  createTable({ id: 'productSetsTable', ajaxUrl: '/product-sets/data', orderColumn: 1, orderType: 'asc', columns })
})
