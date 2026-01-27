jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/teams/${rowData.slug}" data-test="team-link">${rowData.name}</a>`)
      },
    },
    {
      data: 'products',
      render: function (data, type, row) {
        return createSearchableProductList(data)
      },
    },
    {
      data: 'slug',
      createdCell: function (td, _cellData, rowData) {
        const monitor_name = `${formatMonitorName(rowData.name)}`
        const trivy_link = formatTrivyLink(rowData.name)
        $(td).html(
          `<details class="govuk-details"><summary class="govuk-details__summary" data-test="all-links"><span class="govuk-details__summary-text">Links</span></summary><li><a class="govuk-link--no-visited-state" href="/monitor/team/${monitor_name}">Health Monitor</a></li><li><a class="govuk-link--no-visited-state" href="/drift-radiator/teams/${monitor_name}">Deployment drift</a></li><li><a class="govuk-link--no-visited-state" href="/trivy-scans?team=${trivy_link}">Trivy</a></li><li><a class="govuk-link--no-visited-state" data-test="team-overview-link" href="/teams/team-overview/${rowData.slug}">Team Overview</a></li>`,
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

function formatTrivyLink(link) {
  return link.replace(/&/g, '%26').split(' ').join('+')
}
