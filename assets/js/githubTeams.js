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
      createdCell: function (td, _cellData, rowData) {
        const members = rowData.attributes.members
          .map(member => `<li><a href="https://github.com/orgs/ministryofjustice/people/${member}">${member}</a></li>`)
          .join('')

        if (members) {
          $(td).html(members)
        } else {
          $(td).html('No members in this team')
        }
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
