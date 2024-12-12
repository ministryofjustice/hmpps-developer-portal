jQuery(function () {
  function transformData(data) {
    const transformed = []
    data.forEach(item => {
      item.attributes.environments.forEach(env => {
        transformed.push({
          name: item.attributes.name,
          environment: env.name,
          namespace: env.namespace,
          alert_severity_label: env.alert_severity_label,
          alerts_slack_channel: env.alerts_slack_channel,
        })
      })
    })
    return transformed
  }

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
      data: 'environment',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a class="govuk-link--no-visited-state" href="/components/${rowData.name}/environment/${rowData.environment}" data-test="environment">${rowData.environment}</a>`,
        )
      },
      title: 'Environment',
    },
    {
      data: 'namespace',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/namespaces/${rowData.namespace}">${rowData.namespace}</a>`)
      },
      title: 'Namespace',
    },
    {
      data: 'alert_severity_label',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.alert_severity_label)
      },
      title: 'Alert Severity Label',
    },
    {
      data: 'alerts_slack_channel',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.alerts_slack_channel)
      },
      title: 'Alerts Slack Channel',
    },
  ]

  $.ajax({
    url: '/components/data',
    success: function (data) {
      const transformedData = transformData(data)
      createTable({
        id: 'componentsEnvTable',
        data: transformedData,
        orderColumn: 0,
        orderType: 'asc',
        columns,
      })
    },
  })
})
