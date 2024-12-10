jQuery(function () {
  const columns = [
    {
      targets: 0,
      data: 'attributes.name',
      render: function (data, type, row, meta) {
        return `<a class="govuk-link--no-visited-state" href="/components/${cleanColumnOutput(data)}">${cleanColumnOutput(data)}</a>`
      },
    },
    {
      targets: 1,
      data: 'attributes.product.data.attributes.p_id',
      render: function (data, type, row, meta) {
        if (row.attributes.product.data) {
          return `<a class="govuk-link--no-visited-state" href="/products/${row.attributes.product.data.attributes.slug}">${cleanColumnOutput(data)}</a>`
        }
        return 'N/A'
      },
    },
    {
      targets: 2,
      data: 'attributes.product.data.attributes.name',
      render: function (data, type, row, meta) {
        if (row.attributes.product.data) {
          return `<a class="govuk-link--no-visited-state" href="/products/${row.attributes.product.data.attributes.slug}">${cleanColumnOutput(data)}</a>`
        }
        return 'N/A'
      },
    },
    {
      targets: 3,
      data: 'attributes.github_repo',
      render: function (data, type, row, meta) {
        return `<a class="govuk-link--no-visited-state" href="https://github.com/ministryofjustice/${data}" target="_blank" data-test="github-repo">${data}</a>`
      },
    },
    {
      targets: 4,
      data: 'attributes.github_enforce_admins_enabled',
      visible: false,
      render: function (data, type, row, meta) {
        return `${data}`
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
            .join(', ') // Join the array elements into a single string
        }

        return prodSlackChannel
      },
    },
  ]

  $(function () {
    var table = new DataTable('#componentsTable', {
      ajax: {
        url: '/components/data',
        dataSrc: '',
        error: function (xhr, error, thrown) {
          console.error('Error fetching data:', error, thrown)
          console.error('Response:', xhr.responseText)
        },
      },
      order: [[0, 'asc']],
      columnDefs: columns,
      lengthMenu: [
        [10, 25, 50, -1],
        [10, 25, 50, 'All'],
      ],
      layout: {
        bottomStart: {
          buttons: ['colvis', 'copy', 'csv'],
        },
        // topStart: 'paging',
        topEnd: 'search',
      },
    })
  })
})
