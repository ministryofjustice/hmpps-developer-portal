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
      createdCell: function (td, _cellData, rowData) {
        const productsList = createSearchableProductList(td, _cellData, rowData)
        const detailsContent = `<details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Product List
              </span>
            </summary>
            <div class="govuk-details__text">
              ${productsList}
            </div>
          </details>`

        $(td).html(productsList.startsWith('<ul>') ? detailsContent : productsList)
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
