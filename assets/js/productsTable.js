function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  $('#productsTable').DataTable({
    paging: true,
    ajax: {
      url: '/products/data',
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading products.') // eslint-disable-line no-undef
      },
    },

    columns: [
      { data: 'p_id', render: cleanColumnOutput, orderable: true, sorting: true },
      { data: 'name', render: cleanColumnOutput, orderable: true, sorting: true },
    ],

    language: {
      info: 'Showing _START_ to _END_ of _TOTAL_ products',
      infoEmpty: 'Showing 0 to 0 of 0 products',
      emptyTable: 'No products found',
    },
  })
})
