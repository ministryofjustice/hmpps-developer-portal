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
      data: 'attributes.environments',
      visible: false,
      render: function (data, type, row, meta) {
        const environments = row.attributes.environments
        const prodEnvironments = environments ? environments.filter(env => env.name === 'prod') : []

        let prodSlackChannel = ''
        if (prodEnvironments.length === 0) {
          return 'No Prod Environment'
        }

        prodSlackChannel = prodEnvironments
          .map(env => {
            return env.alerts_slack_channel === null ? 'Not set' : `${env.alerts_slack_channel}`
          })
          .join(', ')

        return prodSlackChannel
      },
    },
    {
      data: null,
      createdCell: function (td, _cellData, rowData) {
        const adminTeams = rowData.attributes.github_project_teams_admin
          .map(githubTeam => `<li><a href="/github-teams/${githubTeam}">${githubTeam}</a></li>`)
          .join('')

        const writeTeams = rowData.attributes.github_project_teams_write
          .map(githubTeam => `<li><a href="/github-teams/${githubTeam}">${githubTeam}</a></li>`)
          .join('')
        const maintainTeams = rowData.attributes.github_project_teams_maintain
          .map(githubTeam => `<li><a href="/github-teams/${githubTeam}">${githubTeam}</a></li>`)
          .join('')

        const detailsContent = `<details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">Links</span>
            </summary>
            <div class="govuk-details__text">
              <strong>Admin Teams:</strong>
              <ul>${adminTeams || '<li>No Teams with Admin Access</li>'}</ul>
              <strong>Write Teams:</strong>
              <ul>${writeTeams || '<li>No Teams with Write Access</li>'}</ul>
              <strong>Maintain Teams:</strong>
              <ul>${writeTeams || '<li>No Teams with Write Access</li>'}</ul>
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
