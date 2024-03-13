function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

const getDependencyData = dependencyData => {
  let dependencyName = ''
  let dependencyType = ''

  if (dependencyData) {
    ;[dependencyType, dependencyName] = dependencyData.replace(/[^-a-z0-9:_]/g, '').split('::')
  }

  return {
    dependencyType,
    dependencyName,
  }
}

jQuery(function () {
  $('#selectDependency').on('click', async e => {
    e.preventDefault(e)

    const { dependencyType, dependencyName } = getDependencyData($('#dependencyData').val())

    document.location.href = `/dependencies/${dependencyType}/${dependencyName}`
  })

  let filterType = ''
  let filterValue = ''

  if (teamName.length > 0) {
    filterType = 'team'
    filterValue = teamName
  } else if (productName.length > 0) {
    filterType = 'product'
    filterValue = productName
  } else if (serviceAreaName.length > 0) {
    filterType = 'serviceArea'
    filterValue = serviceAreaName
  } else if (customComponentName.length > 0) {
    filterType = 'customComponent'
    filterValue = customComponentName
  }

  console.log(`filterType:${filterType} / filterValue:${filterValue}`)

  const semverTidy = semVer => {
    // sometimes comes through as a number which has no match method
    const semVerString = `${semVer}`

    if (semVerString && !semVerString.match(/^\d+(\.\d+){0,2}$/)) {
      return semVerString
    }

    ;[major, minor = '.', patch = '.'] = semVerString.split('.')

    return `0000${major}`.slice(-4) + `0000${minor}`.slice(-4) + `0000${patch}`.slice(-4)
  }

  $.extend($.fn.dataTable.ext.type.order, {
    'semver-asc': function (a, b) {
      a = semverTidy(a)
      b = semverTidy(b)
      return a < b ? -1 : a > b ? 1 : 0
    },
    'semver-desc': function (a, b) {
      a = semverTidy(a)
      b = semverTidy(b)
      return a < b ? 1 : a > b ? -1 : 0
    },
  })
  console.log(`/dependencies/data/${dataDependencyType}/${dataDependencyName}/${filterType}/${filterValue}`)
  $('#dependenciesTable').DataTable({
    lengthMenu: [
      [10, 25, 50, 75, 100, -1],
      [10, 25, 50, 75, 100, 'All'],
    ],
    paging: false,
    pagingType: 'simple_numbers',
    order: [[1, 'asc']],
    sortable: true,
    ajax: {
      url: `/dependencies/data/${dataDependencyType}/${dataDependencyName}/${filterType}/${filterValue}`,
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading teams.') // eslint-disable-line no-undef
      },
    },

    columns: [
      {
        data: 'componentName',
        createdCell: function (td, cellData, rowData) {
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
    ],
  })
})
