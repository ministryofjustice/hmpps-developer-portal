jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/scheduled-jobs/${rowData.name}" data-test="scheduled-job-link">${rowData.name}</a>`)
      },
    },
    {
      data: 'description',
    },
    {
      data: 'schedule',
    },
    {
      data: 'last_scheduled_run',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(formatDateToDDMONYYYYHH24MMSS(rowData.last_scheduled_run))
      },
    },
    {
      data: 'result',
    },
    {
      data: 'last_successful_run',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(formatDateToDDMONYYYYHH24MMSS(rowData.last_successful_run))
      },
    },
    {
      data: 'error_details',
      createdCell: function (td, _cellData, rowData) {
        const result = rowData.result
        const errorDetails = rowData.error_details
        if (Array.isArray(errorDetails) && errorDetails.length > 0) {
          const errorList = errorDetails.map(error => `<li>${error}</li>`).join('')
          const detailsContent = `<details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Error Details
              </span>
            </summary>
            <div class="govuk-details__text">
              <ul>${errorList}</ul>
            </div>
          </details>`
          $(td).html(detailsContent)
        } else {
          $(td).html('')
        }
      },
    },
  ]

  createTable({
    id: 'scheduledJobsTable',
    ajaxUrl: '/scheduled-jobs/data',
    orderColumn: 1,
    orderType: 'asc',
    columns,
  })
})

function formatDateToDDMONYYYYHH24MMSS(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
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
}
