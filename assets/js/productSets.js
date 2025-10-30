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
      render: function (td, _cellData, rowData) {
        const header = `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Product List</span></summary>`
        const products = rowData.products
        if (Array.isArray(products) && products.length > 0) {
          return products
            .map(
              product =>
                `<li><a href="/products/${product.slug}" data-test="product-${product.id}">${product.name}</a></li>`,
            )
            .join('\n')
        }
        return '<span class="no-products">No Products</span>'
      },
    },
  ]

  createTable({ id: 'productSetsTable', ajaxUrl: '/product-sets/data', orderColumn: 1, orderType: 'asc', columns })
})
