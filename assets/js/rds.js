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
        $(td).html(
          `<a href="https://github.com/ministryofjustice/cloud-platform-environments/tree/main/namespaces/live.cloud-platform.service.justice.gov.uk/${rowData.namespace}" target="_blank">${display}</a>`,
        )
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
      data: 'rds_family',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${rowData.rds_family}</a>`)
      },
    },
    {
      data: 'db_engine_version',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${rowData.db_engine_version}</a>`)
      },
    },
    {
      data: 'environment_name',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${rowData.environment_name}</a>`)
      },
    },
    {
      data: 'maintenance_window',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${rowData.maintenance_window}</a>`)
      },
    },
    {
      data: 'allow_minor_version_upgrade',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${rowData.allow_minor_version_upgrade}</a>`,
        )
      },
    },
    {
      data: 'allow_major_version_upgrade',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/reports/rds/${rowData.tf_label}-${rowData.namespace}">${rowData.allow_major_version_upgrade}</a>`,
        )
      },
    },
  ]

  createTable({ id: 'rdsInstancesTable', ajaxUrl: '/reports/rds/data', orderColumn: 0, orderType: 'asc', columns })
})
