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
      { data: 'p_id', render: cleanColumnOutput },
      { data: 'name', render: cleanColumnOutput },
    ],
  })
})
