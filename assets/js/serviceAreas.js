jQuery(function () {
  const columns = [
    {
      data: 'attributes.name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/service-areas/${rowData.attributes.slug}">${rowData.attributes.name}</a>`)
      },
    },
    {
      data: 'attributes.owner',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.owner}`)
      },
    },
    {
      data: 'attributes.products',
      createdCell: function (td, _cellData, rowData) {
        const header = `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Product List</span></summary>`
        const products = rowData.attributes.products.data
          .map(
            product =>
              `<li><a href="/products/${product.attributes.slug}" data-test="product-${product.id}">${product.attributes.name}</a></li>`,
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
