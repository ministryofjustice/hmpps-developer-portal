jQuery(function () {
  const columns = [
    {
      data: 'github_team_id',
      visible: false,
    },
    {
      data: 'team_name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/github-teams/${rowData.team_name}">${rowData.team_name}</a>`)
      },
    },
    {
      data: 'parent_team_name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          rowData.parent_team_name === 'hmpps-developers' || rowData.parent_team_name === null
            ? `${rowData.parent_team_name}`
            : `<a href="/github-teams/${rowData.parent_team_name}">${rowData.parent_team_name}</a>`,
        )
      },
    },
    {
      data: 'team_desc',
    },
    {
      data: 'members',
      createdCell: function (td, _cellData, rowData) {
        const membersList = renderGithubTeams(rowData)
        if (membersList) {
          $(td).html(`<ul>${membersList}</ul>`)
        } else {
          $(td).html('No members in this team')
        }
      },
    },
    {
      data: 'terraform_managed',
    },
  ]

  createTable({
    id: 'githubTeamsTable',
    ajaxUrl: '/github-teams/data',
    orderColumn: 1,
    orderType: 'asc',
    columns,
  })
})

function renderGithubTeams(rowData) {
  const members = rowData.members
    .map(
      member =>
        `<li><a href="https://github.com/orgs/ministryofjustice/people/?query=${member}" class="govuk-link govuk-link--no-visited-state">${member}</a></li>`,
    )
    .join('')
  return members
}
