jQuery(function () {
  const columns = [
    {
      data: 'tf_label',
      createdCell: function (td, _cellData, rowData) {
        const display = `${rowData.tf_label}`.trim()
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${display}</a>`)
      },
    },
    {
      data: 'namespace',
      createdCell: function (td, _cellData, rowData) {
        const display = `${rowData.namespace}`.trim()
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${display}</a>`)
      },
    },
    {
      data: 'db_instance_class',
      createdCell: function (td, _cellData, rowData) {
        const display = `${rowData.db_instance_class}`.trim()
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${display}</a>`)
      },
    },
    {
      data: 'db_engine_version',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${rowData.rds_family} (${rowData.db_engine_version})</a>`,
        )
      },
    },
  ]

  createTable({ id: 'rdsInstancesTable', ajaxUrl: '/reports/rds/data', orderColumn: 0, orderType: 'asc', columns })
})
