jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a class="govuk-link--no-visited-state" href="/components/${cleanColumnOutput(rowData.name)}">${cleanColumnOutput(
            rowData.name,
          )}</a>`,
        )
      },
    },
    {
      data: 'product.p_id',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.product.p_id
          ? `<a class="govuk-link--no-visited-state" href="/products/${rowData.product.slug}">${cleanColumnOutput(
              rowData.product.p_id,
            )}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'product.name',
      createdCell: function (td, _cellData, rowData) {
        const link = rowData.product.name
          ? `<a class="govuk-link--no-visited-state" href="/products/${rowData.product.slug}">${cleanColumnOutput(
              rowData.product.name,
            )}</a>`
          : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'github_repo',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a class="govuk-link--no-visited-state" href="https://github.com/ministryofjustice/${rowData.github_repo}" target="_blank" data-test="github-repo"> ${rowData.github_repo}</a>`,
        )
      },
    },
    {
      data: 'github_enforce_admins_enabled',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`${rowData.github_enforce_admins_enabled}`)
      },
    },
    {
      data: null,
      render: function (data, type, rowData, meta) {
        const prodEnvironments = (rowData?.envs || []).filter(env => env.name === 'prod')

        if (prodEnvironments.length === 0) {
          const displayVal = 'No Prod Environment'
          const filterVal = displayVal
          const sortVal = 'zzzzz'
          if (type === 'display') return displayVal
          if (type === 'filter') return filterVal
          return sortVal
        }

        const displayList = prodEnvironments.map(env =>
          env.alerts_slack_channel === null ? 'Not set' : env.alerts_slack_channel,
        )
        const filterList = prodEnvironments.map(env => env.alerts_slack_channel || 'Not set')
        const sortList = prodEnvironments
          .map(env => {
            const channel = env.alerts_slack_channel
            return channel === null ? 'zzzz' : channel.toLowerCase().replace(/[^a-z0-9]/g, '')
          })
          .sort()

        switch (type) {
          case 'display':
            return displayList.join(', ')
          case 'filter':
            return filterList.join(' ')
          default:
            return sortList.join(' ')
        }
      },
    },
    {
      data: null,
      createdCell: function (td, _cellData, rowData) {
        const adminTeams = renderGithubTeams(rowData.github_project_teams_admin, 'No Teams with Admin Access')
        const writeTeams = renderGithubTeams(rowData.github_project_teams_write, 'No Teams with Write Access')
        const maintainTeams = renderGithubTeams(rowData.github_project_teams_maintain, 'No Teams with Maintain Access')
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
      data: 'github_project_teams_admin',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const githubTeams = rowData.github_project_teams_admin
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
      data: 'github_project_teams_write',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const githubTeams = rowData.github_project_teams_write
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
      data: 'github_project_teams_maintain',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const githubTeams = rowData.github_project_teams_maintain
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
