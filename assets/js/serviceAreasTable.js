function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  $('#serviceAreasTable').DataTable({
    paging: true,
    order: [[0, 'asc']],
    sortable: true,
    ajax: {
      url: '/service-areas/data',
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading service areas.') // eslint-disable-line no-undef
      },
    },

    columns: [{ data: 'name', render: cleanColumnOutput }],
  })
})
