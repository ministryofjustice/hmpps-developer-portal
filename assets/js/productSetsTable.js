function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  $('#productSetsTable').DataTable({
    lengthMenu: [
      [10, 25, 50, 75, 100, -1],
      [10, 25, 50, 75, 100, 'All'],
    ],
    paging: true,
    order: [[1, 'asc']],
    sortable: true,
    ajax: {
      url: '/product-sets/data',
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading product sets.') // eslint-disable-line no-undef
      },
    },

    columns: [
      {
        data: 'attributes.ps_id',
        createdCell: function (td, cellData, rowData) {
          $(td).html(`<a href="/product-sets/${rowData.id}">${rowData.attributes.ps_id}</a>`)
        },
      },
      {
        data: 'attributes.name',
        createdCell: function (td, cellData, rowData) {
          $(td).html(`<a href="/product-sets/${rowData.id}">${rowData.attributes.name}</a>`)
        },
      },
    ],
  })
})
