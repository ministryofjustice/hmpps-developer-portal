function cleanColumnOutput(data) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

function createTable({
  id,
  ajaxUrl,
  data,
  orderColumn,
  orderType,
  columns,
  pageLength = 10,
  columnDropdowns = false,
  columnSearchText = true,
}) {
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
    layout: {
      bottomStart: {
        buttons: [
          'colvis',
          {
            extend: 'copy',
            exportOptions: {
              columns: ':visible',
            },
          },
          {
            extend: 'csv',
            exportOptions: {
              columns: ':visible',
            },
          },
        ],
      },
    },
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
        if (ajaxUrl !== undefined) {
          alert('An error occurred when loading table data.') // eslint-disable-line no-undef
        }
      },
    },
    data,
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
      if (columnSearchText) {
        this.api()
          .columns()
          .every(function () {
            const column = this
            const title = column.footer().textContent + ' (regex)'

            // Create input element
            const input = document.createElement('input')
            input.placeholder = title
            column.footer().replaceChildren(input)

            // Event listener for user input
            input.addEventListener('keyup', () => {
              if (column.search() !== this.value) {
                const regex = true
                const smart = false
                column.search(input.value, regex, smart).draw()
              }
            })
          })
      }
    },
  })
}
