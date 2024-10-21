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
    {
      data: 'attributes.products',
      createdCell: function (td, _cellData, rowData) {
        const header = `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Product List</span></summary>`
        const products = rowData.attributes.products.data
          .map(product => {
            return `<li><a href="/products/${product.attributes.slug}" data-test="product-${product.id}">${product.attributes.name}</a></li>`
          })
          .join('')

        if (products) $(td).html(`${header}${products}`)
        else $(td).html(`No Products`)
      },
    },
  ]

  createTable({ id: 'productSetsTable', ajaxUrl: '/product-sets/data', orderColumn: 1, orderType: 'asc', columns })
})
