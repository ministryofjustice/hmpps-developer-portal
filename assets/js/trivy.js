class TrivyRenderer {
  constructor(csrfToken, viewMode) {
    this.csrfToken = csrfToken
    this.viewMode = viewMode
  }

  post = async (url, body) => {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken,
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`There was a problem calling: ${url}`)
    }
    return response.json()
  }

  fetchMessages = async componentNames => {
    const vulnerabilities = await this.post('/trivy/data', { componentNames })
    createTable({
      id: 'trivyTable',
      data: vulnerabilities,
      orderColumn: 2,
      orderType: 'desc',
      columns,
    })
  }

  start = async componentNames => {
    await this.fetchMessages(componentNames)
  }
}

jQuery(function () {
  $('#updateProduct,#updateTeam,#updateServiceArea,#updateCustomComponentView').on('click', async e => {
    e.preventDefault()

    const type = e.target.dataset.typeName
    const dataId = e.target.dataset.associatedSelectId

    const selectedItem = $(`#${dataId}`).val()
    if (!selectedItem) {
      return
    }
    window.location = `/trivy/${type}/${formatTrivyName(selectedItem)}`
  })
})

function formatTrivyName(name) {
  return `${name} `
    .trim()
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^-a-z0-9]/g, '')
    .replace(/-+/g, '-')
}

const columns = [
  {
    data: 'name',
    createdCell: function (td, _cellData, rowData) {
      $(td).html(`<a href="/components/${cleanColumnOutput(rowData.name)}">${cleanColumnOutput(rowData.name)}</a>`)
    },
  },
  {
    data: 'title',
    createdCell: function (td, _cellData, rowData) {
      $(td).html(`${cleanColumnOutput(rowData.title)}`)
    },
  },
  {
    data: 'lastScan',
    createdCell: function (td, _cellData, rowData) {
      const date = new Date(rowData.lastScan)
      const formattedDate = date.toLocaleString('en-GB', { timeZone: 'UTC' })
      $(td).html(formattedDate)
    },
  },
  {
    data: 'vulnerability',
    createdCell: function (td, _cellData, rowData) {
      if (rowData.primaryUrl) {
        $(td).html(`<a href="${rowData.primaryUrl}" target="_blank">${cleanColumnOutput(rowData.vulnerability)}</a>`)
      } else {
        $(td).html(`${cleanColumnOutput(rowData.vulnerability)}`)
      }
    },
  },
  {
    data: 'severity',
    createdCell: function (td, _cellData, rowData) {
      $(td).html(`${cleanColumnOutput(rowData.severity)}`)
    },
  },
  {
    data: 'references',
    createdCell: function (td, _cellData, rowData) {
      $(td).html(rowData.references)
    },
  },
]
