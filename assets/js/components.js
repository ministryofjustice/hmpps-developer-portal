jQuery(function () {
  const columns = [
    {
      data: 'attributes.name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a class="govuk-link--no-visited-state" href="/components/${cleanColumnOutput(rowData.attributes.name)}">${cleanColumnOutput(
            rowData.attributes.name,
          )}</a>`,
        )
      },
    },
    {
      data: 'attributes.product.data.attributes.p_id',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.attributes.product.data
          ? `<a class="govuk-link--no-visited-state" href="/products/${rowData.attributes.product.data.attributes.slug}">${cleanColumnOutput(
              rowData.attributes.product.data.attributes.p_id,
            )}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'attributes.product.data.attributes.name',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.attributes.product.data
          ? `<a class="govuk-link--no-visited-state" href="/products/${rowData.attributes.product.data.attributes.slug}">${cleanColumnOutput(
              rowData.attributes.product.data.attributes.name,
            )}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
  ]

  createTable({
    id: 'componentsTable',
    ajaxUrl: '/components/data',
    orderColumn: 0,
    orderType: 'asc',
    columns,
  })
})
