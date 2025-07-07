jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/service-areas/${rowData.id}">${rowData.name}</a>`)
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
      createdCell: function (td, _cellData, rowData) {
        const header = `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Product List</span></summary>`
        const products = rowData.products
          .map(
            product =>
              `<li><a href="/products/${product.slug}" data-test="product-${product.id}">${product.name}</a></li>`,
          )
          .join('')
        if (products) {
          $(td).html(`${products}`)
        } else {
          $(td).html(`No Products`)
        }
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
