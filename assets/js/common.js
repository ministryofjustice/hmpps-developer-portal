function cleanColumnOutput(data) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

function createTable(id, ajaxUrl, orderColumn, orderType, columns) {
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

  return new DataTable(`#${id}`, {
    lengthMenu: [
      [10, 25, 50, 75, 100, -1],
      [10, 25, 50, 75, 100, 'All'],
    ],
    paging: true,
    pagingType: 'simple_numbers',
    order: [[orderColumn, orderType]],
    sortable: true,
    ajax: {
      url: ajaxUrl,
      dataSrc: '',
      error: function () {
        alert('An error occurred when loading table data.') // eslint-disable-line no-undef
      },
    },
    columns,
  })
}
