jQuery(function () {
  const columns = [
    {
      data: 'github_repo',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/component-requests/${rowData.github_repo}">${rowData.github_repo}</a>`)
      },
    },
    {
      data: 'requester_name',
    },
    {
      data: 'request_github_pr_status',
    },
    {
      data: 'request_github_pr_number',
      createdCell: function (td, _cellData, rowData) {
        if (rowData.request_github_pr_number) {
          $(td).html(
            `<a href="https://github.com/ministryofjustice/hmpps-project-bootstrap/pull/${rowData.request_github_pr_number}">${rowData.request_github_pr_number}</a>`,
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
