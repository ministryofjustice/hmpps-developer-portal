jQuery(function () {
    const columns = [
      {
        data: 'tf_label',
        createdCell: function (td, _cellData, rowData) {
          const display = `${rowData.tf_label}`.trim()
          $(td).html(`${rowData.name}</a>`)
        },
      },
      {
        data: 'tf_label',
        createdCell: function (td, _cellData, rowData) {
          const display = `${rowData.tf_label}`.trim()
          $(td).html(`${rowData.request_processed_status}</a>`)
        },
      }
    ]
  
    console.log('columns', columns)
    createTable({ id: 'componentRequestsTable', ajaxUrl: '/forms/componentRequests', orderColumn: 0, orderType: 'asc', columns })
  })
