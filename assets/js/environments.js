jQuery(function () {
  function transformData(data) {
    const transformed = []
    data.forEach(item => {
      item.attributes.environments.forEach(env => {
        const productData = item.attributes?.product?.data?.attributes || {}
        const teamData = productData.team?.data ? productData.team.data.attributes : null
        transformed.push({
          name: item.attributes.name,
          environment: env.name,
          namespace: env.namespace,
          infoPath: env.info_path === null ? 'Not set' : env.info_path,
          healthPath: env.health_path === null ? 'Not set' : env.health_path,
          appurl: env.url === null ? 'Not set' : env.url,
          monitor: env.monitor === null ? 'Not set' : env.monitor.toString(),
          active_agencies: env.active_agencies,
          ip_allow_list_enabled: env.ip_allow_list_enabled === null ? 'Not set' : env.ip_allow_list_enabled.toString(),
          include_in_subject_access_requests:
            env.include_in_subject_access_requests === null
              ? 'Not set'
              : env.include_in_subject_access_requests.toString(),
          modsecurity_enabled: env.modsecurity_enabled === null ? 'Not set' : env.modsecurity_enabled.toString(),
          modsecurity_audit_enabled:
            env.modsecurity_audit_enabled === null ? 'Not set' : env.modsecurity_audit_enabled.toString(),
          build_image_tag: env.build_image_tag,
          alert_severity_label: env.alert_severity_label === null ? 'Not set' : env.alert_severity_label,
          alerts_slack_channel:
            env.alerts_slack_channel === null || env.alerts_slack_channel === '' ? 'Not set' : env.alerts_slack_channel,
          product_id: productData ? productData.p_id : '',
          product_name: productData ? productData.name : '',
          product_slug: productData ? productData.slug : '',
          team_name: teamData ? teamData.name : '',
          team_slug: teamData ? teamData.slug : '',
        })
      })
    })
    return transformed
  }

  const columns = [
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
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a class="govuk-link--no-visited-state" href="/components/${cleanColumnOutput(rowData.name)}">${cleanColumnOutput(
            rowData.name,
          )}</a>`,
        )
      },
      title: 'Name',
    },
    {
      data: 'product_id',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        if (rowData.product_id && rowData.product_slug) {
          $(td).html(
            `<a class="govuk-link--no-visited-state" href="/products/${rowData.product_slug}">${rowData.product_id}</a>`,
          )
        } else {
          $(td).html('Not set')
        }
      },
      title: 'Product ID',
    },
    {
      data: 'product_name',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        if (rowData.product_id && rowData.product_slug) {
          $(td).html(
            `<a class="govuk-link--no-visited-state" href="/products/${rowData.product_slug}">${rowData.product_name}</a>`,
          )
        } else {
          $(td).html('Not set')
        }
      },
      title: 'Product Name',
    },
    {
      data: 'team_name',
      createdCell: function (td, _cellData, rowData) {
        if (rowData.team_name && rowData.team_slug) {
          $(td).html(
            `<a class="govuk-link--no-visited-state" href="/teams/${rowData.team_slug}">${rowData.team_name}</a>`,
          )
        } else {
          $(td).html('Not set')
        }
      },
      title: 'Team',
    },
    {
      data: 'namespace',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/namespaces/${rowData.namespace}">${rowData.namespace}</a>`)
      },
      title: 'Namespace',
    },
    {
      data: 'infoPath',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.infoPath)
      },
      title: 'Info Path',
    },
    {
      data: 'healthPath',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.healthPath)
      },
      title: 'Health Path',
    },
    {
      data: 'appurl',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.appurl)
      },
      title: 'App URL',
    },
    {
      data: 'monitor',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.monitor)
      },
      title: 'Monitor',
    },
    {
      data: 'active_agencies',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const activeAgencies = formatActiveAgencies(rowData.active_agencies)
        $(td).html(activeAgencies)
      },
      title: 'Active Agencies',
    },
    {
      data: 'ip_allow_list_enabled',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.ip_allow_list_enabled)
      },
      title: 'IP Allow List Enabled',
    },
    {
      data: 'include_in_subject_access_requests',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.include_in_subject_access_requests)
      },
      title: 'Include in Subject Access Requests',
    },
    {
      data: 'modsecurity_enabled',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.modsecurity_enabled)
      },
      title: 'ModSecurity Enabled',
    },
    {
      data: 'modsecurity_audit_enabled',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.modsecurity_audit_enabled)
      },
      title: 'ModSecurity Audit Enabled',
    },
    {
      data: 'build_image_tag',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.build_image_tag)
      },
      title: 'Build Image Tag',
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
        id: 'componentsEnvironmentTable',
        data: transformedData,
        orderColumn: 1,
        orderType: 'asc',
        columns,
      })
    },
  })
})

function formatActiveAgencies(activeAgencies) {
  if (!activeAgencies || activeAgencies.length < 1) {
    return 'Not set'
  }
  if (activeAgencies.includes('***')) {
    return 'All agencies'
  }
  return activeAgencies.join(', ')
}
