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
        $(td).html(`${rowData.attributes.last_scheduled_run}`)
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
        $(td).html(`${rowData.attributes.last_successful_run}`)
      },
    },
    {
      data: 'attributes.error_details',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.error_details}`)
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
