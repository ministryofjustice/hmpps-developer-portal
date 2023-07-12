function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  $('#componentsTable').DataTable({
    paging: true,
    order: [[0, 'asc']],
    sortable: true,
    ajax: {
      url: '/components/data',
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading components.') // eslint-disable-line no-undef
      },
    },

    columns: [
      {
        data: 'attributes.name',
        createdCell: function (td, cellData, rowData) {
          $(td).html(`<a href="/components/${rowData.id}">${rowData.attributes.name}</a>`)
        },
      },
      {
        data: 'attributes.product.data.id',
        createdCell: function (td, cellData, rowData) {
          const link = rowData.attributes.product.data
            ? `<a href="/products/${rowData.attributes.product.data.id}">${rowData.attributes.product.data.attributes.p_id}</a>`
            : 'N/A'
          $(td).html(link)
        },
      },
      {
        data: 'attributes.product.data.id',
        createdCell: function (td, cellData, rowData) {
          const link = rowData.attributes.product.data
            ? `<a href="/products/${rowData.attributes.product.data.id}">${rowData.attributes.product.data.attributes.name}</a>`
            : 'N/A'
          $(td).html(link)
        },
      },
    ],
  })
})
