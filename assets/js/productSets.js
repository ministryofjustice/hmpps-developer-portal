jQuery(function () {
  const columns = [
    {
      data: 'ps_id',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.ps_id}`)
      },
    },
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/product-sets/${rowData.documentId}" data-test="product-set-link">${rowData.name}</a>`)
      },
    },
    {
      data: 'products',
      render: createSearchableProductList,
    },
  ]

  createTable({ id: 'productSetsTable', ajaxUrl: '/product-sets/data', orderColumn: 1, orderType: 'asc', columns })
})
