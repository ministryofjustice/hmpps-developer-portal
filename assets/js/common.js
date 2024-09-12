function cleanColumnOutput(data) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

function createTable({ id, ajaxUrl, orderColumn, orderType, columns, pageLength = 10, columnDropdowns = false }) {
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

  const table = new DataTable(`#${id}`, {
    lengthMenu: [
      [10, 25, 50, 75, 100, -1],
      [10, 25, 50, 75, 100, 'All'],
    ],
    pageLength,
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
    initComplete: function () {
      if (columnDropdowns) {
        this.api()
          .columns()
          .every(function () {
            const column = this

            // Create select element
            const select = document.createElement('select')
            select.add(new Option(''))
            column.footer().replaceChildren(select)

            // Apply listener for user change in value
            select.addEventListener('change', function () {
              column.search(select.value, { exact: true }).draw()
            })

            // Add list of options
            column
              .data()
              .unique()
              .sort()
              .each(function (d, j) {
                select.add(new Option(d))
              })
          })
      }
    },
  })

  const anchorBlock = document.createElement('div')
  anchorBlock.setAttribute('id', 'showHideBlock')
  const tableElement = document.querySelector(`#${id}`)
  tableElement.insertAdjacentElement('beforebegin', anchorBlock)

  document.querySelectorAll(`#${id} thead th`).forEach((columnNameElement, columnIndex) => {
    const name = columnNameElement.textContent
    const anchor = document.createElement('a')
    anchor.appendChild(document.createTextNode(`Show/Hide ${name}`))
    anchorBlock.appendChild(anchor)

    anchor.addEventListener('click', function (e) {
      e.preventDefault()
      const column = table.column(columnIndex)
      column.visible(!column.visible())
    })
  })

  return table
}
