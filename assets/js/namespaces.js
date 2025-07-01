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
  ]

  createTable({ id: 'namespacesTable', ajaxUrl: '/namespaces/data', orderColumn: 0, orderType: 'asc', columns })
})
