function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  $('#productsTable').DataTable({
    paging: true,
    order: [[1, 'asc']],
    sortable: true,
    ajax: {
      url: '/products/data',
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading products.') // eslint-disable-line no-undef
      },
    },

    columns: [
      {
        data: 'id',
        createdCell: function (td, cellData, rowData) {
          $(td).html(`<a href="/products/${rowData.id}">${rowData.attributes.p_id}</a>`)
        },
      },
      { data: 'attributes.name', render: cleanColumnOutput },
    ],
  })
})
