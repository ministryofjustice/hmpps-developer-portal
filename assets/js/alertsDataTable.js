const applicationFilter = document.getElementById('application')
const environmentFilter = document.getElementById('environment')
const namespaceFilter = document.getElementById('namespace')
const severityFilter = document.getElementById('severity')
const teamFilter = document.getElementById('team')

jQuery(function () {
  const columns = [
    {
      data: 'labels.alertname',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.labels.alertname}`)
      },
    },
    {
      data: 'startsAt',
      createdCell: function (td, _cellData, rowData) {
        // const startsAt = formatTimeStamp(new Date(rowData.startsAt))
        const startsAt = formatTimeStamp(rowData.startsAt)
        // const startsAt = Date.parse(rowData.startsAt)
        $(td).html(`${startsAt}`)
        // $(td).html(`${rowData.startsAt}`)
      },
    },
    {
      data: 'annotations.message',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.annotations.message}`)
      },
    },
    {
      data: 'labels.alert_slack_channel',
      createdCell: function (td, _cellData, rowData) {
        const slackLink = rowData.labels.alert_slack_channel || 'N/A'
        if (slackLink) $(td).html(`<a href="slack://channel?team=T02DYEB3A&id=${slackLink}">${slackLink}</a>`)
      },
    },
    {
      data: 'annotations',
      createdCell: function (td, _cellData, rowData) {
        const dashboardLink = rowData.annotations.dashboard_url
          ? `<a href="${rowData.annotations.dashboard_url}" class="statusTileHealth" target="_blank">Dashboard</a>`
          : ''
        const runbookLink = rowData.annotations.runbook_url
          ? `<a href="${rowData.annotations.runbook_url}" class="statusTileHealth" target="_blank">Runbook</a>`
          : ''
        const generatorLink = rowData.generatorURL
          ? `<a href="${rowData.generatorURL}" class="statusTileHealth" target="_blank">View</a>`
          : ''

        $(td).html(`<ul><li>${dashboardLink}</li><li>${runbookLink}</li><li>${generatorLink}</li></ul>`)
      },
    },
  ]

  const alertsTable = createTable({
    id: 'alertsTable',
    ajaxUrl: '/alerts/all',
    orderColumn: 2,
    orderType: 'asc',
    columns,
    responsive: true,
  })
  console.log('create table', createTable)

  let count = 0

  setInterval(function () {
    alertsTable.ajax.reload(null, false) // user paging is not reset on reload
    console.log('data reloaded, count =', (count += 1))
    lastUpdatedTime()
  }, 5000)

  lastUpdatedTime()
  alertsUpdateFrequencyMessage()
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

function alertsUpdateFrequencyMessage() {
  $('#alertsFetchStatus').empty()
  return $('#alertsFetchStatus').append(
    `<div class="govuk-inset-text">Alerts are being updated every <strong>5</strong> seconds</div>`,
  )
}

function lastUpdatedTime() {
  const currentTime = new Date()
  const lastUpdatedTimestamp = formatTimeStamp(currentTime)
  document.getElementById('lastUpdated').textContent = `Last updated: ${lastUpdatedTimestamp}`
}
