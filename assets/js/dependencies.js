jQuery(function () {
  $('#selectDependency').on('click', async e => {
    e.preventDefault(e)

    const typeSelect = document.getElementById('dependencyType')
    const nameSelect = document.getElementById('dependencyName')

    const type = typeSelect.value.replace(/[^-a-z0-9:_]/g, '')
    const name = nameSelect.value.replace(/[^-a-z0-9:_\/.]/gi, '').replace(/\//g, '~')

    if (type && name) {
      // Redirect to the existing route
      window.location.href = `/dependencies/${encodeURIComponent(type)}/${encodeURIComponent(name)}`
    }
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
      createdCell: function (td, _cellData, rowData) {
        const version = rowData.dependencyVersion || ''
        const hash = typeof rowData.dependencyHash === 'string' ? rowData.dependencyHash.trim() : ''

        if (!hash) {
          $(td).text(version)
          return
        }

        const tooltipId = `dep-hash-${rowData.id}`
        const escapedHash = cleanColumnOutput(hash)
        const escapedVersion = cleanColumnOutput(version)

        $(td).html(`
          <span class="moj-tooltip-wrapper" style="position:relative;display:inline-block;">
            <button
              type="button"
              class="govuk-link"
              aria-describedby="${tooltipId}"
              aria-expanded="false"
              style="background:none;border:0;padding:0;cursor:help;text-decoration:underline;"
            >
              ${escapedVersion}
            </button>
            <span
              id="${tooltipId}"
              role="tooltip"
              hidden
              style="position:absolute;left:0;top:calc(100% + 6px);z-index:1000;background:#0b0c0c;color:#fff;padding:6px 8px;border-radius:4px;white-space:nowrap;font-size:14px;"
            >
              ${escapedHash}
            </span>
          </span>
        `)

        const button = td.querySelector('button')
        const tooltip = td.querySelector('[role="tooltip"]')

        const show = () => {
          tooltip.hidden = false
          button.setAttribute('aria-expanded', 'true')
        }

        const hide = () => {
          tooltip.hidden = true
          button.setAttribute('aria-expanded', 'false')
        }

        button.addEventListener('mouseenter', show)
        button.addEventListener('focus', show)
        button.addEventListener('mouseleave', hide)
        button.addEventListener('blur', hide)
      },
    },
    {
      data: 'location',
      createdCell: function (td, _cellData, rowData) {
        const url = rowData.location
        try {
          const parsedUrl = new URL(url)
          const pathSegments = parsedUrl.pathname.split('/')
          const croppedText = pathSegments.slice(-2).join('/') // final directory + filename
          $(td).html(`<a href="${url}" target="_blank">${croppedText}</a>`)
        } catch (e) {
          $(td).text('')
        }
      },
    },
  ]

  createTable({
    id: 'dependenciesTable',
    ajaxUrl: `/dependencies/data/${dataDependencyType}/${dataDependencyName.replace(/\//g, '~')}`,
    orderColumn: 1,
    orderType: 'asc',
    columns,
  })
})

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form')
  const typeSelect = document.getElementById('dependencyType')
  const nameSelect = document.getElementById('dependencyName')
  const updateButton = document.getElementById('selectDependency')
  const spinner = document.getElementById('loadingSpinner')
  const defaultOption = document.createElement('option')
  defaultOption.value = ''
  defaultOption.textContent = 'Please select'

  typeSelect.addEventListener('change', async () => {
    const selectedType = typeSelect.value
    nameSelect.innerHTML = ''
    updateButton.disabled = true
    spinner.hidden = false

    if (!selectedType) {
      nameSelect.appendChild(defaultOption)
      spinner.hidden = true
      updateButton.disabled = true
      return
    }

    try {
      const response = await fetch(`/dependencies/dependency-names/${encodeURIComponent(selectedType)}`)
      const names = await response.json()
      nameSelect.appendChild(defaultOption)

      names.forEach(name => {
        const option = document.createElement('option')
        option.value = name.value
        option.textContent = name.text
        nameSelect.appendChild(option)
      })
    } catch (err) {
      console.error('Failed to load dependency names:', err)
    } finally {
      spinner.hidden = true
      updateButton.disabled = false
    }
  })

  form.addEventListener('submit', event => {
    event.preventDefault()

    const type = typeSelect.value
    const name = nameSelect.value

    if (type && name) {
      window.location.href = `/dependencies/${encodeURIComponent(type)}/${encodeURIComponent(name)}`
    }
  })
})
