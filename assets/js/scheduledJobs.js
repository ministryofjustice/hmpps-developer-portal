jQuery(function () {
  const columns = [
    {
      data: 'attributes.name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/scheduled-jobs/${rowData.attributes.name}">${rowData.attributes.name}</a>`)
      },
    },
    {
      data: 'attributes.description',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.description}</a>`)
      },
    },
    {
      data: 'attributes.schedule',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.schedule}`)
      },
    },
    {
      data: 'attributes.last_scheduled_run',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(formatDateToDDMONYYYYHH24MMSS(rowData.attributes.last_scheduled_run))
      },
    },
    {
      data: 'attributes.result',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.result}`)
      },
    },
    {
      data: 'attributes.last_successful_run',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(formatDateToDDMONYYYYHH24MMSS(rowData.attributes.last_successful_run))
      },
    },
    {
      data: 'attributes.error_details',
      createdCell: function (td, _cellData, rowData) {
        const result = rowData.attributes.result
        const errorDetails = rowData.attributes.error_details

        if (result === 'Failed' || result === 'Errors') {
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
