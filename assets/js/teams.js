jQuery(function () {
  const columns = [
    {
      data: 'attributes.name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(`<a href="/teams/${rowData.attributes.slug}">${rowData.attributes.name}</a>`)
      },
    },
    {
      data: 'attributes.slack_channel_name',
      createdCell: function (td, _cellData, rowData) {
        if (rowData.attributes.slack_channel_id)
          $(td).html(
            `<a href="slack://channel?team=T02DYEB3A&id=${rowData.attributes.slack_channel_id}">#${rowData.attributes.slack_channel_name}</a>`,
          )
      },
    },
    {
      data: 'attributes.products',
      createdCell: function (td, _cellData, rowData) {
        if (rowData.attributes.products.data.attributes.name) {
          for (product in rowData.attributes.products.data) {
            $(td).html(`${product.name}</a></li>`)
          }
        }
      },
    },
  ]

  createTable({ id: 'teamsTable', ajaxUrl: '/teams/data', orderColumn: 0, orderType: 'asc', columns })
})
