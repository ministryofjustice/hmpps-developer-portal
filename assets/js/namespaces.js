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
              `<a href="/namespaces/${rowData.name}/rds_instance/${rdsInstance.tf_label}">${rdsInstance.tf_label}</a>`,
          )
          .join('<br>')
        $(td).html(rdsInstances || 'N/A')
      },
      render: function (data, type, rowData) {
        if (type === 'display') {
          return data && data.length
            ? data
                .map(
                  rdsInstance =>
                    `<a href="/namespaces/${rowData.name}/rds_instance/${rdsInstance.tf_label}">${rdsInstance.tf_label}</a>`,
                )
                .join('</br>')
            : 'N/A'
        }
        // sort and filter
        if (!data || !data.length) return 'zzzzz'
        return data
          .map(rdsInstance => rdsInstance.tf_label)
          .join('<br>')
          .toLowerCase()
      },
    },
    {
      data: 'elasticache_cluster',
      createdCell: function (td, _cellData, rowData) {
        const elasticache = rowData.elasticache_cluster
          .map(
            cache =>
              `<a href="/namespaces/${rowData.name}/elasticache_cluster/${cache.tf_label}">${cache.tf_label}</a>`,
          )
          .join('<br>')
        $(td).html(elasticache || 'N/A')
      },
      render: function (data, type) {
        if (type === 'display') {
          return data && data.length ? data.map(cache => cache.tf_label).join('<br>') : 'N/A'
        }
        // sort and filter
        if (!data || !data.length) return 'zzzzz'
        return data
          .map(cache => cache.tf_label)
          .join('<br>')
          .toLowerCase()
      },
    },
    {
      data: 'pingdom_check',
      createdCell: function (td, _cellData, rowData) {
        const pingdom = rowData.pingdom_check
          .map(pingdom => {
            const encodedName = encodeURIComponent(pingdom.name) // Encode the name for URL safety
            return `<a href="/namespaces/${rowData.name}/pingdom_check/${encodedName}" target="_blank">${pingdom.name}</a>`
          })
          .join('<br>')
        const content = pingdom || 'N/A'
        $(td).html(content)
      },
      render: function (data, type) {
        if (type === 'display') {
          return data && data.length
            ? data.map(pingdom => pingdom.name).join('<br>') // Use <br> to separate entries with line breaks
            : 'N/A'
        }
        // For sorting and filtering
        if (!data || !data.length) return 'zzzzz'
        return data
          .map(pingdom => pingdom.name)
          .join(' ')
          .toLowerCase()
      },
    },
    {
      data: 'hmpps_template',
      createdCell: function (td, _cellData, rowData) {
        const hmppsTemplates = rowData.hmpps_template
          .map(
            template =>
              `<a href="/namespaces/${rowData.name}/hmpps_template/${template.tf_label}">${template.tf_label}</a>`,
          )
          .join('<br>')

        if (hmppsTemplates) {
          $(td).html(hmppsTemplates)
        } else {
          $(td).text('N/A')
        }
      },
      render: function (data, type, rowData) {
        if (type === 'display') {
          return data && data.length
            ? data
                .map(
                  template =>
                    `<a href="/namespaces/${rowData.name}/hmpps_templates/${template.tf_label}">${template.tf_label}</a>`,
                )
                .join('<br>')
            : 'N/A'
        }

        if (!data || !data.length) return 'zzzzz'
        return data
          .map(template => template.tf_label)
          .join(' ')
          .toLowerCase()
      },
    },
  ]

  createTable({ id: 'namespacesTable', ajaxUrl: '/namespaces/data', orderColumn: 0, orderType: 'asc', columns })
})
