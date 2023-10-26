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

  const semverTidy = semVerString => {
    if (!semVerString.match(/^\d+\.\d+\.\d+$/)) {
      return ''
    }

    ;[major, minor, patch] = semVerString.split('.')

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

  $('#dependenciesTable').DataTable({
    paging: false,
    order: [[1, 'asc']],
    sortable: true,
    ajax: {
      url: `/dependencies/data/${dataDependencyType}/${dataDependencyName}`,
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
