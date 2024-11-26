jQuery(function () {
    const columns = [
      {
        data: 'attributes.github_repo',
        createdCell: function (td, _cellData, rowData) {
          $(td).html(`${rowData.attributes.github_repo}</a>`)
        },
      },
      {
        data: 'attributes.repo_description',
        createdCell: function (td, _cellData, rowData) {
          $(td).html(`${rowData.attributes.repo_description}</a>`)
        },
      },
    ]

    createTable({ id: 'componentRequestsTable', ajaxUrl: '/forms/component-requests/data', orderColumn: 0, orderType: 'asc', columns })
  })
