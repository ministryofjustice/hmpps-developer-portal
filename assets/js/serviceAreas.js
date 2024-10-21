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
        for (const key in rowData.attributes.products) {
          var pList = ''
          pList = `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Product List</span></summary>`
          rowData.attributes.products[key].forEach(product => {
            pList += `<li><a href="/products/${product.attributes.slug}" data-test="product-${product.id}">${product.attributes.name}</a></li>`
          })
        }
        if (pList) $(td).html(pList)
        else $(td).html(`No Products`)
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
