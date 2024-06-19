jQuery(function () {
  $('#selectDependency').on('click', async e => {
    e.preventDefault(e)

    let dependencyName = ''
    let dependencyType = ''
    const dependencyData = $('#dependencyData').val()

    if (dependencyData) {
      ;[dependencyType, dependencyName] = dependencyData.replace(/[^-a-z0-9:_]/g, '').split('::')
    }

    document.location.href = `/dependencies/${dependencyType}/${dependencyName}`
  })

  const columns = [
    {
      data: 'componentName',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/components/${cleanColumnOutput(rowData.componentName)}">${cleanColumnOutput(
            rowData.componentName,
          )}</a>`,
        )
      },
    },
    {
      data: 'dependencyVersion',
      type: 'semver',
    },
  ]

  createTable('dependenciesTable', `/dependencies/data/${dataDependencyType}/${dataDependencyName}`, 1, 'asc', columns)
})
