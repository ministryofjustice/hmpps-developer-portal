jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a data-test="service-area-name-link" href="/service-areas/${rowData.slug}">${rowData.name}</a>`)
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
      render: function (data, type, row) {
        const products = Array.isArray(data) ? data : []
        const searchValue = products.map(product => product.name).join(' ')

        if (type !== 'display') {
          return searchValue
        }

        const productsList = createSearchableProductList(products)

        // Only wraps in details component if there's a list, otherwise shows "No Products"
        if (productsList.startsWith('<ul>')) {
          return `
            <details class="govuk-details">
              <summary class="govuk-details__summary">
                <span class="govuk-details__summary-text">
                  Product List
                </span>
              </summary>
              <div class="govuk-details__text">
                ${productsList}
              </div>
            </details>
          `
        }

        return productsList
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
