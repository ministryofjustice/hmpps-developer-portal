function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  $('#serviceAreasTable').DataTable({
    lengthMenu: [
      [10, 25, 50, 75, 100, -1],
      [10, 25, 50, 75, 100, 'All'],
    ],
    paging: true,
    pagingType: 'simple_numbers',
    order: [[0, 'asc']],
    sortable: true,
    ajax: {
      url: '/service-areas/data',
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading service areas.') // eslint-disable-line no-undef
      },
    },

    columns: [
      {
        data: 'attributes.name',
        createdCell: function (td, cellData, rowData) {
          $(td).html(`<a href="/service-areas/${rowData.id}">${rowData.attributes.name}</a>`)
        },
      },
    ],
  })
})
