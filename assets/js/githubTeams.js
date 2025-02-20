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
        const parentTeamName = rowData.attributes.parent_team_name 
          ? rowData.attributes.parent_team_name.replace(/\s+/g, '-') 
          : null;
    
        $(td).html(
          parentTeamName === null
            ? `${parentTeamName}`
            : `<a href="/github-teams/${parentTeamName}">${parentTeamName}</a>`,
        );
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
        const membersList = renderGithubTeams(rowData)
        if (membersList) {
          $(td).html(membersList)
        } else {
          $(td).html('No members in this team')
        }
      },
    },
    {
      data: 'attributes.terraform_managed',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.terraform_managed}`)
      },
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
  const members = rowData.attributes.members
    .map(member =>
      `<li><a href="https://github.com/orgs/ministryofjustice/people/?query=${encodeURIComponent(member)}" class="govuk-link govuk-link--no-visited-state">${member}</a></li>`
    )
    .join('');
  return members;
}
