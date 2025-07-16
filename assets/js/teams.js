jQuery(function () {
  const columns = [
    {
      data: 'attributes.name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/teams/${rowData.attributes.slug}">${rowData.attributes.name}</a>`)
      },
    },
    {
      data: 'attributes.slack_channel_name',
      createdCell: function (td, _cellData, rowData) {
        if (rowData.attributes.slack_channel_id)
          $(td).html(
            `<a href="slack://channel?team=T02DYEB3A&id=${rowData.attributes.slack_channel_id}">#${rowData.attributes.slack_channel_name}</a>`,
          )
      },
    },
    {
      data: 'attributes.products',
      createdCell: function (td, _cellData, rowData) {
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
    {
      data: 'attributes.slug',
      createdCell: function (td, _cellData, rowData) {
        const monitor_name = `${formatMonitorName(rowData.attributes.name)}`
        $(td).html(
          `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Links</span></summary><li><a class="govuk-link--no-visited-state" href="/monitor/team/${monitor_name}">Health Monitor</a></li><li><a class="govuk-link--no-visited-state" href="/drift-radiator/teams/${monitor_name}">Deployment drift</a></li><li><a class="govuk-link--no-visited-state" href="/trivy-scans/${monitor_name}">Trivy</a></li><li><a class="govuk-link--no-visited-state" href="/team-overview/teams/${rowData.attributes.slug}">Team Overview</a></li>`,
        )
      },
    },
  ]

  createTable({ id: 'teamsTable', ajaxUrl: '/teams/data', orderColumn: 0, orderType: 'asc', columns })
})

function formatMonitorName(name) {
  return `${name} `
    .trim()
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^-a-z0-9]/g, '')
    .replace(/-+/g, '-')
}
