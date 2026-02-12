jQuery(function () {
  const columns = [
    {
      data: 'p_id',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a data-test="id-links" href="/products/${rowData.slug}">${rowData.p_id}</a>`)
      },
    },
    { data: 'name', render: cleanColumnOutput },
    {
      data: 'portfolio',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.portfolio}`)
      },
    },
    {
      data: 'phase',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.phase}`)
      },
    },
    {
      data: 'product_set.ps_id',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.product_set
          ? `<a href="/product-sets/${rowData.product_set.documentId}">${cleanColumnOutput(rowData.product_set.ps_id)}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'product_set.name',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.product_set
          ? `<a href="/product-sets/${rowData.product_set.documentId}">${cleanColumnOutput(rowData.product_set.name)}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'team.name',
      render: function (data, type, row) {
        return row.team ? `<a href="/teams/${row.team.slug}">${cleanColumnOutput(row.team.name)}</a>` : 'Unknown'
      },
    },
    {
      data: 'service_area.name',
      render: function (data, type, row) {
        return row.service_area
          ? `<a href="/service-areas/${row.service_area.slug}">${cleanColumnOutput(row.service_area.name)}</a>`
          : 'Unknown'
      },
    },
    {
      data: 'lead_developer',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.lead_developer}`)
      },
    },
    {
      data: 'decommissioned',
      createdCell: function (td, _cellData, rowData) {
        decommissioned = rowData.decommissioned ? 'Yes' : 'No'
        $(td).html(`${decommissioned}`)
      },
    },
  ]

  createTable({
    id: 'productsTable',
    ajaxUrl: '/products/data',
    orderColumn: 0,
    orderType: 'asc',
    columns,
  })
})
