jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/namespaces/${rowData.name}">${rowData.name}</a>`)
      },
    },
    {
      data: 'rds_instance',
      createdCell: function (td, _cellData, rowData) {
        const rdsInstances = rowData.rds_instance
          .map(
            rdsInstance =>
              `<a href="/reports/rds/${rdsInstance.tf_label}-${rdsInstance.namespace}">${rdsInstance.tf_label}</a>`,
          )
          .join('')
        $(td).html(rdsInstances || 'N/A')
      },
      render: function (data, type) {
        if (type === 'display') {
          return data && data.length
            ? data
                .map(
                  rdsInstance =>
                    `<a href="/reports/rds/${rdsInstance.tf_label}-${rdsInstance.namespace}">${rdsInstance.tf_label}</a>`,
                )
                .join('')
            : 'N/A'
        }
        // sort and filter
        if (!data || !data.length) return 'zzzzz'
        return data
          .map(rdsInstance => rdsInstance.tf_label)
          .join(' ')
          .toLowerCase()
      },
    },
    {
      data: 'elasticache_cluster',
      createdCell: function (td, _cellData, rowData) {
        const elasticache = rowData.elasticache_cluster.map(cache => `${cache.tf_label}`).join('')
        $(td).html(elasticache || 'N/A')
      },
      render: function (data, type) {
        if (type === 'display') {
          return data && data.length ? data.map(cache => cache.tf_label).join('') : 'N/A'
        }
        // sort and filter
        if (!data || !data.length) return 'zzzzz'
        return data
          .map(cache => cache.tf_label)
          .join(' ')
          .toLowerCase()
      },
    },
    {
      data: 'pingdom_check',
      createdCell: function (td, _cellData, rowData) {
        const pingdom = rowData.pingdom_check.map(pingdom => `${pingdom.tf_label}`).join('')
        const content = pingdom
          ? `<is thispan style="color: green">&#10004</span>` // Green checkmark
          : `<span style="color: red">&#10008</span>` // Red X mark
        if (pingdom) {
          $(td).html(`<a href="/namespaces/${rowData.name}/pingdom">${content}</a>`)
        } else {
          $(td).html(content)
        }
      },
      render: function (data, type) {
        if (type === 'display') {
          return data && data.length
            ? `<span style="color: green">&#10004</span>` // Green checkmark
            : `<span style="color: red">&#10008</span>` // Red X mark
        }
        // For sorting and filtering
        if (!data || !data.length) return 'zzzzz'
        return data
          .map(pingdom => pingdom.tf_label)
          .join(' ')
          .toLowerCase()
      },
    },
    {
      data: 'hmpps_template',
      createdCell: function (td, _cellData, rowData) {
        const hmppsTemplates = rowData.hmpps_template
          .map(
            template => `<a href="/namespaces/${rowData.name}/templates/${template.tf_label}">${template.tf_label}</a>`,
          )
          .join('<br>')

        if (hmppsTemplates) {
          $(td).html(hmppsTemplates)
        } else {
          $(td).text('None')
        }
      },
      render: function (data, type, rowData) {
        if (type === 'display') {
          return data && data.length
            ? data
                .map(
                  template =>
                    `<a href="/namespaces/${rowData.name}/templates/${template.tf_label}">${template.tf_label}</a>`,
                )
                .join('<br>')
            : 'None'
        }
        // For sorting and filtering
        if (!data || !data.length) return 'zzzzz'
        return data
          .map(template => template.tf_label)
          .join(' ')
          .toLowerCase()
      },
    },
  ]

  createTable({ id: 'namespacesTable', ajaxUrl: '/namespaces/data', orderColumn: 0, orderType: 'asc', columns })
  console.log(namespacesTable)
})
