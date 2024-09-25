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
    const vulnerabilities = await this.post('/reports/trivy/data', { componentNames })
    console.log(vulnerabilities)
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
  $('#updateProduct').on('click', async e => {
    e.preventDefault(e)
    const productCode = document.getElementById('product').value
    window.location = `/trivy/products/${productCode}`
  })
})

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
