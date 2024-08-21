jQuery(function () {
  const columns = [
    {
      data: 'tf_label',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}">${rowData.tf_label}</a>`)
      },
    },
    {
      data: 'namespace',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}">${rowData.namespace}</a>`)
      },
    },
    {
      data: 'db_instance_class',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}">${rowData.db_instance_class}</a>`)
      },
    },
    {
      data: 'db_engine_version',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}">${rowData.rds_family} (${rowData.db_engine_version})</a>`)
      },
    },
    {
      data: 'db_max_allocated_storage',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}">${rowData.db_max_allocated_storage}</a>`)
      },
    },
  ]

  createTable('rdsInstancesTable', '/reports/rds/data', 0, 'asc', columns)
})
