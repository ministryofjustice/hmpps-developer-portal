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
      targets: 5,
      data: 'attributes.environments',
      render: function (data, type, row, meta) {
        const environments = row.attributes.environments
        const prodEnvironments = environments ? environments.filter(env => env.name === 'prod') : []

        let prodSlackChannel = ''
        if (prodEnvironments.length === 0) {
          prodSlackChannel = 'No Prod environment'
        } else {
          prodSlackChannel = prodEnvironments
            .map(env => {
              if (env.alerts_slack_channel === null) {
                return 'Missing slack channel data'
              }
              return `${env.alerts_slack_channel}`
            })
            .join(', ')
        }

        return prodSlackChannel
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
