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
    },
    {
      data: 'location',
      createdCell: function (td, _cellData, rowData) {
        const url = rowData.location
        try {
          const parsedUrl = new URL(url)
          const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
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
