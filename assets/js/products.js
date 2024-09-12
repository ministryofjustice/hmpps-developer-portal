jQuery(function () {
  const columns = [
    {
      data: 'attributes.p_id',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/products/${rowData.attributes.slug}">${rowData.attributes.p_id}</a>`)
      },
    },
    { data: 'attributes.name', render: cleanColumnOutput },
    {
      data: 'attributes.product_set.data.attributes.ps_id',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.attributes.product_set.data
          ? `<a href="/product-sets/${rowData.attributes.product_set.data.id}">${cleanColumnOutput(
              rowData.attributes.product_set.data.attributes.ps_id,
            )}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'attributes.product_set.data.attributes.name',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.attributes.product_set.data
          ? cleanColumnOutput(rowData.attributes.product_set.data.attributes.name)
          : 'N/A'
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
