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
      render: function (td, _cellData, rowData) {
        const header = `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Product List</span></summary>`
        const products = rowData.products
        const productItems = products
          .map(
            product =>
              `<li><a href="/products/${product.slug}" data-test="product-${product.id}">${product.name}</a></li>`,
          )
          .join('\n')
        if (Array.isArray(products) && products.length > 0) {
          return `<ul>${productItems}</ul>`
        }
        return `<ul class="no-products">No Products</ul>`
      },
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
