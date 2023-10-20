function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  const dataDependencyType = dependencyType || 'helm'
  const dataDependencyName = dependencyName || 'generic-service'

  $('#dependenciesTable').DataTable({
    paging: false,
    order: [[1, 'asc']],
    sortable: true,
    ajax: {
      url: `/components/dependencies/data/${dataDependencyType}/${dataDependencyName}`,
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading teams.') // eslint-disable-line no-undef
      },
    },

    columns: [
      {
        data: 'componentName',
        createdCell: function (td, cellData, rowData) {
          $(td).html(`<a href="/components/${rowData.id}">${rowData.componentName}</a>`)
        },
      },
      {
        data: 'dependencyVersion',
      },
    ],
  })
})
