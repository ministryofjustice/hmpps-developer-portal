jQuery(function () {
  const columns = [
    {
      data: 'attributes.name',
      render: function (data, type, row, meta) {
        return `<a class="govuk-link--no-visited-state" href="/components/${cleanColumnOutput(data)}">${cleanColumnOutput(data)}</a>`
      },
    },
    {
      data: 'attributes.product.data.attributes.p_id',
      render: function (data, type, row, meta) {
        if (row.attributes.product.data) {
          return `<a class="govuk-link--no-visited-state" href="/products/${row.attributes.product.data.attributes.slug}">${cleanColumnOutput(data)}</a>`
        }
        return 'N/A'
      },
    },
    {
      data: 'attributes.product.data.attributes.name',
      render: function (data, type, row, meta) {
        if (row.attributes.product.data) {
          return `<a class="govuk-link--no-visited-state" href="/products/${row.attributes.product.data.attributes.slug}">${cleanColumnOutput(data)}</a>`
        }
        return 'N/A'
      },
    },
    {
      data: 'attributes.github_repo',
      render: function (data, type, row, meta) {
        return `<a class="govuk-link--no-visited-state" href="https://github.com/ministryofjustice/${data}" target="_blank" data-test="github-repo">${data}</a>`
      },
    },
    {
      data: 'attributes.github_enforce_admins_enabled',
      visible: false,
      render: function (data, type, row, meta) {
        return `${data}`
      },
    },
    {
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
    columnDropdowns: true,
  })
})
