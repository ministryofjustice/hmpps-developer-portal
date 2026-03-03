jQuery(function () {
  const currentUrl = window.location.href
  const urlParams = new URLSearchParams(window.location.search)
  const decommissioned = urlParams.get('decommissioned')
  const isDecommissioned = new URLSearchParams(window.location.search).get('decommissioned') === 'true'
  console.log(isDecommissioned)
  const ajaxUrl = decommissioned ? `/products/data?decommissioned=${decommissioned}` : '/products/data'

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
      visible: isDecommissioned,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.decommissioned ? 'Yes' : 'No'}`)
      },
    },
    {
      data: 'decommissioned_date',
      visible: isDecommissioned,
      createdCell: function (td, _cellData, rowData) {
        if (rowData.decommissioned_date) {
          $(td).text(new Date(rowData.decommissioned_date).toLocaleDateString())
        } else {
          $(td).text(' ')
        }
      },
    },
  ]

  createTable({
    id: 'productsTable',
    ajaxUrl: ajaxUrl,
    orderColumn: 0,
    orderType: 'asc',
    columns,
  })
})
