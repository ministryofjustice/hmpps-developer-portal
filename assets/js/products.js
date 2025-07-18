jQuery(function () {
  const columns = [
    {
      data: 'p_id',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/products/${rowData.slug}">${rowData.p_id}</a>`)
      },
    },
    { data: 'name', render: cleanColumnOutput },
    {
      data: 'product_set.ps_id',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.product_set
          ? `<a href="/product-sets/${rowData.product_set.id}">${cleanColumnOutput(rowData.product_set.ps_id)}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'product_set.name',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.product_set ? cleanColumnOutput(rowData.product_set.name) : 'N/A'
        $(td).html(link)
      },
    },
  ]

  createTable({
    id: 'productsTable',
    ajaxUrl: '/products/data',
    orderColumn: 1,
    orderType: 'asc',
    columns,
  })
})
