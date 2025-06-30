jQuery(function () {
  const columns = [
    {
      data: 'attributes.name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a class="govuk-link--no-visited-state" href="/components/${cleanColumnOutput(rowData.attributes.name)}">${cleanColumnOutput(
            rowData.attributes.name,
          )}</a>`,
        )
      },
    },
    {
      data: 'attributes.product.data.attributes.p_id',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.attributes.product.data
          ? `<a class="govuk-link--no-visited-state" href="/products/${rowData.attributes.product.data.attributes.slug}">${cleanColumnOutput(
              rowData.attributes.product.data.attributes.p_id,
            )}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'attributes.product.data.attributes.name',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.attributes.product.data
          ? `<a class="govuk-link--no-visited-state" href="/products/${rowData.attributes.product.data.attributes.slug}">${cleanColumnOutput(
              rowData.attributes.product.data.attributes.name,
            )}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'attributes.github_repo',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a class="govuk-link--no-visited-state" href="https://github.com/ministryofjustice/${rowData.attributes.github_repo}" target="_blank" data-test="github-repo"> ${rowData.attributes.github_repo}</a>`,
        )
      },
    },
    {
      data: 'attributes.github_enforce_admins_enabled',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.attributes.github_enforce_admins_enabled}`)
      },
    },
    {
      data: 'attributes.envs',
      render: function (data, type, row, meta) {
        const envs = Array.isArray(row.attributes.envs.data) ? row.attributes.envs.data : []
        const prodEnvs = envs.filter(env => env.attributes.name === 'prod')

        if (prodEnvs.length === 0) {
          const displayVal = 'No Prod Environment'
          const filterVal = displayVal
          const sortVal = 'zzzzz'
          if (type === 'display') return displayVal
          if (type === 'filter') return filterVal
          return sortVal
        } else {
          const prodEnvironment = prodEnvs[0].attributes
          const displayVal =
            prodEnvironment.alerts_slack_channel === null ? 'Not set' : prodEnvironment.alerts_slack_channel
          const filterVal = prodEnvironment.alerts_slack_channel || 'Not set'
          const sortVal = prodEnvironment.alerts_slack_channel === null
          switch (type) {
            case 'display':
              return displayVal
            case 'filter':
              return filterVal
            default:
              return sortVal
          }
        }
      },
    },
    {
      data: null,
      createdCell: function (td, _cellData, rowData) {
        const adminTeams = renderGithubTeams(
          rowData.attributes.github_project_teams_admin,
          'No Teams with Admin Access',
        )
        const writeTeams = renderGithubTeams(
          rowData.attributes.github_project_teams_write,
          'No Teams with Write Access',
        )
        const maintainTeams = renderGithubTeams(
          rowData.attributes.github_project_teams_maintain,
          'No Teams with Maintain Access',
        )
        const detailsContent = `<details class="govuk-details">
          <summary class="govuk-details__summary">
            <span class="govuk-details__summary-text">Links</span>
          </summary>
          <div class="govuk-details__text">
            <strong>Admin Teams:</strong>
            <ul>${adminTeams}</ul>
            <strong>Write Teams:</strong>
            <ul>${writeTeams}</ul>
            <strong>Maintain Teams:</strong>
            <ul>${maintainTeams}</ul>
          </div>
        </details>`
        $(td).html(detailsContent)
      },
    },
    {
      data: 'attributes.github_project_teams_admin',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const githubTeams = rowData.attributes.github_project_teams_admin
          .map(githubTeam => `<li><a href="/github-teams/${githubTeam}">${githubTeam}</a></li>`)
          .join('')

        if (githubTeams) {
          $(td).html(githubTeams)
        } else {
          $(td).html('No Teams with Admin Access')
        }
      },
    },
    {
      data: 'attributes.github_project_teams_write',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const githubTeams = rowData.attributes.github_project_teams_write
          .map(githubTeam => `<li><a href="/github-teams/${githubTeam}">${githubTeam}</a></li>`)
          .join('')

        if (githubTeams) {
          $(td).html(githubTeams)
        } else {
          $(td).html('No Teams with Write Access')
        }
      },
    },
    {
      data: 'attributes.github_project_teams_maintain',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const githubTeams = rowData.attributes.github_project_teams_maintain
          .map(githubTeam => `<li><a href="/github-teams/${githubTeam}">${githubTeam}</a></li>`)
          .join('')

        if (githubTeams) {
          $(td).html(githubTeams)
        } else {
          $(td).html('No Teams with maintain Access')
        }
      },
    },
  ]

  createTable({
    id: 'componentsTable',
    ajaxUrl: '/components/data',
    orderColumn: 0,
    orderType: 'asc',
    columns,
  })
})

const renderGithubTeams = (teams, noTeamsMessage) => {
  return (
    teams
      .map(
        githubTeam =>
          `<li><a href="/github-teams/${githubTeam}"  class="govuk-link govuk-link--no-visited-state">${githubTeam}</a></li>`,
      )
      .join('') || `<li>${noTeamsMessage}</li>`
  )
}
