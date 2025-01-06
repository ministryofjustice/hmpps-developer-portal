jQuery(function () {
  const columns = [
    {
      data: 'attributes.team_name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/github-team-requests/${rowData.attributes.team_name}">${rowData.attributes.team_name}</a>`,
        )
      },
    },
    {
      data: 'attributes.team_desc',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.team_desc}`)
      },
    },
    {
      data: 'attributes.parent_team_name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          rowData.attributes.parent_team_name === 'hmpps-developers'
            ? `${rowData.attributes.parent_team_name}`
            : `<a href="/github-team-requests/${rowData.attributes.parent_team_name}">${rowData.attributes.parent_team_name}</a>`,
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
            `<a href="https://github.com/ministryofjustice/hmpps-github-teams/pull/${rowData.attributes.request_github_pr_number}">${rowData.attributes.request_github_pr_number}</a>`,
          )
        } else {
          $(td).html('')
        }
      },
    },
  ]

  createTable({
    id: 'githubTeamRequestsTable',
    ajaxUrl: '/github-team-requests/data',
    orderColumn: 3,
    orderType: 'desc',
    columns,
  })
})
