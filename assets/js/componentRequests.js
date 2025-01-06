jQuery(function () {
  const columns = [
    {
      data: 'attributes.github_repo',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/component-requests/${rowData.attributes.github_repo}">${rowData.attributes.github_repo}</a>`,
        )
      },
    },
    {
      data: 'attributes.requester_name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.requester_name}`)
      },
    },
    {
      data: 'attributes.request_github_pr_status',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.request_github_pr_status}`)
      },
    },
    {
      data: 'attributes.request_github_pr_number',
      createdCell: function (td, _cellData, rowData) {
        if (rowData.attributes.request_github_pr_number) {
          $(td).html(
            `<a href="https://github.com/ministryofjustice/hmpps-project-bootstrap/pull/${rowData.attributes.request_github_pr_number}">${rowData.attributes.request_github_pr_number}</a>`,
          )
        } else {
          $(td).html('')
        }
      },
    },
  ]

  createTable({
    id: 'componentRequestsTable',
    ajaxUrl: '/component-requests/data',
    orderColumn: 3,
    orderType: 'desc',
    columns,
  })
})
