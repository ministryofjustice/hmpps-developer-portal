jQuery(function () {
  const columns = [
    {
      data: 'attributes.github_username',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/github-users/${rowData.attributes.github_username}">${rowData.attributes.github_username}</a>`,
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
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.github_teams}`)
      },
    },
  ]

  createTable({
    id: 'githubUsersTable',
    ajaxUrl: '/github-users/data',
    orderColumn: 1,
    orderType: 'asc',
    columns,
  })
})
