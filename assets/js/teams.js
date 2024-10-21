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
        for (const key in rowData.attributes.products) {
          var pList = ''
          rowData.attributes.products[key].forEach(product => {
            pList += `<li><a href="/products/${product.attributes.slug}" data-test="product-${product.id}">${product.attributes.name}</a></li>`
          })
        }
        if (pList) $(td).html(pList)
        else $(td).html('None')
      },
    },
    {
      data: 'attributes.slug',
      createdCell: function (td, _cellData, rowData) {
        var monitor_name = `${formatMonitorName(rowData.attributes.name)}`
        $(td).html(
          `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Links</span></summary><li><a class="govuk-link--no-visited-state" href="/monitor/team/${monitor_name}">Health Monitor</a></li><li><a class="govuk-link--no-visited-state" href="/drift-radiator/teams/${monitor_name}">Deployment drift</a></li><li><a class="govuk-link--no-visited-state" href="/trivy/teams/${monitor_name}">Trivy</a></li>`,
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
