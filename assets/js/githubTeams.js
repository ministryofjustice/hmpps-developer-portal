jQuery(function () {
  const columns = [
    {
      data: 'attributes.github_team_id',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.github_team_id}`)
      },
    },
    {
      data: 'attributes.team_name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/github-teams/${rowData.attributes.team_name}">${rowData.attributes.team_name}</a>`)
      },
    },
    {
      data: 'attributes.parent_team_name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          rowData.attributes.parent_team_name === 'hmpps-developers'
            ? `${rowData.attributes.parent_team_name}`
            : `<a href="/github-teams/${rowData.attributes.parent_team_name}">${rowData.attributes.parent_team_name}</a>`,
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
      data: 'attributes.members',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.members}`)
      },
    },
  ]

  createTable({
    id: 'githubTeamsTable',
    ajaxUrl: '/github-teams/data',
    orderColumn: 2,
    orderType: 'asc',
    columns,
  })
})
