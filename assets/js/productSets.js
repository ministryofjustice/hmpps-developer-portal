jQuery(function () {
  const columns = [
    {
      data: 'ps_id',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/product-sets/${rowData.documentId}">${rowData.ps_id}</a>`)
      },
    },
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/product-sets/${rowData.documentId}">${rowData.name}</a>`)
      },
    },
    {
      data: 'products',
      render: createSearchableProductList,
    },
  ]

  createTable({ id: 'productSetsTable', ajaxUrl: '/product-sets/data', orderColumn: 1, orderType: 'asc', columns })
})
