function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  $('#productSetsTable').DataTable({
    paging: true,
    order: [[0, 'asc']],
    sortable: true,
    ajax: {
      url: '/product-sets/data',
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading products.') // eslint-disable-line no-undef
      },
    },

    columns: [{ data: 'name', render: cleanColumnOutput }],
  })
})
