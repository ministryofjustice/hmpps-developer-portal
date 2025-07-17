const applicationFilter = document.getElementById('application')
const environmentFilter = document.getElementById('environment')
const namespaceFilter = document.getElementById('namespace')
const severityFilter = document.getElementById('severity')
const teamFilter = document.getElementById('team')

jQuery(async function () {
  const columns = [
    {
      data: 'Alertname',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.labels.alertname}`)
      },
    },
    {
      data: 'Started at',
      createdCell: function (td, _cellData, rowData) {
        const startsAt = formatTimeStamp(new Date(rowData.startsAt))
        $(td).html(`${startsAt}`)
      },
    },
    {
      data: 'Message',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.annotations.message}`)
      },
    },
    {
      data: 'Slack Channel',
      createdCell: function (td, _cellData, rowData) {
        const slackLink = rowData.labels.alert_slack_channel || 'N/A'
        if (slackLink) $(td).html(`<a href="slack://channel?team=T02DYEB3A&id=${slackLink}">${slackLink}</a>`)
      },
    },
    {
      data: 'Links',
      createdCell: function (td, _cellData, rowData) {
        const dashboardLink = rowData.annotations.dashboard_url
          ? `<a href="${rowData.annotations.dashboard_url}" class="statusTileHealth" target="_blank">Dashboard</a>`
          : ''
        const runbookLink = rowData.annotations.runbook_url
          ? `<a href="${rowData.annotations.runbook_url}" class="statusTileHealth" target="_blank">Runbook<a>`
          : ''
        const generatorLink = rowData.generatorURL
          ? `<a href="${rowData.generatorURL}" class="statusTileHealth" target="_blank">View</a>`
          : ''

        $(td).html(`${[dashboardLink, runbookLink, generatorLink].filter(link => link !== '').join(' ') || 'N/A'}`)
      },
    },
  ]

  createTable({
    id: 'alertsTable',
    ajaxUrl: '/alerts/all',
    orderColumn: 2,
    orderType: 'asc',
    columns,
  })
  console.log('create table', createTable)
})

function formatTimeStamp(dateString) {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) throw new Error('Invalid date')
    return date
      .toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(',', '')
      .toUpperCase()
  } catch (error) {
    return 'Invalid date'
  }
}
