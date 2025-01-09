jQuery(function () {
  const columns = [
    {
      data: 'attributes.github_username',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/github-user-requests/${rowData.attributes.github_username}">${rowData.attributes.github_username}</a>`,
        )
      },
    },
    {
      data: 'attributes.full_name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.full_name}`)
      },
    },
    {
      data: 'attributes.user_email',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.user_email}`)
      },
    },
    {
      data: 'attributes.github_teams',
      visibility: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.github_teams}`)
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
            `<a href="https://github.com/ministryofjustice/hmpps-github-teams/pull/${rowData.attributes.request_github_pr_number}">${rowData.attributes.request_github_pr_number}</a>`,
          )
        } else {
          $(td).html('')
        }
      },
    },
  ]

  createTable({
    id: 'githubUserRequestsTable',
    ajaxUrl: '/github-user-requests/data',
    orderColumn: 6,
    orderType: 'desc',
    columns,
  })
})
