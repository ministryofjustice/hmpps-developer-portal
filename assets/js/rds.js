jQuery(function () {
  const columns = [
    {
      data: 'tf_label',
      createdCell: function (td, _cellData, rowData) {
        const display = `${rowData.tf_label}`.trim()
        $(td).html(`<a href="/namespaces/${rowData.namespace}/rds_instance/${display}">${display}</a>`)
      },
    },
    {
      data: 'namespace',
      createdCell: function (td, _cellData, rowData) {
        const display = `${rowData.namespace}`.trim()
        $(td).html(
          `<a href="https://github.com/ministryofjustice/cloud-platform-environments/tree/main/namespaces/live.cloud-platform.service.justice.gov.uk/${rowData.namespace}" target="_blank">${display}</a>`,
        )
      },
    },
    {
      data: 'db_instance_class',
      createdCell: function (td, _cellData, rowData) {
        const display = `${rowData.db_instance_class}`.trim()
        $(td).html(display)
      },
    },
    {
      data: 'rds_family',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.rds_family)
      },
    },
    {
      data: 'db_engine_version',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.db_engine_version)
      },
    },
    {
      data: 'environment_name',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.environment_name)
      },
    },
    {
      data: 'maintenance_window',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.maintenance_window)
      },
    },
    {
      data: 'allow_minor_version_upgrade',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.allow_minor_version_upgrade)
      },
    },
    {
      data: 'allow_major_version_upgrade',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.allow_major_version_upgrade)
      },
    },
  ]

  createTable({ id: 'rdsInstancesTable', ajaxUrl: '/reports/rds/data', orderColumn: 0, orderType: 'asc', columns })
})
