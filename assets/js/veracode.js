class VeracodeRenderer {
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
    const vulnerabilities = await this.post('/reports/veracode/data', { componentNames })
    console.log(vulnerabilities)
    createTable({
      id: 'VeracodeTable',
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

    // const dropDownType = e.target.dataset.typeName
    // const dropDownTypeId = e.target.dataset.associatedSelectId
    // const dropDownTypeIdValue = Number.parseInt($(`#${dropDownType}`).val())
    // console.log(dropDownTypeIdValue)
    // console.log(dropDownTypeId)
    // console.log(dropDownType)

    // const selectedItem = $(`#${dropDownTypeId}`).val()
    // if (!selectedItem) {
    //   return
    // }
    // // window.location = `/veracode/${type}/${formatVeracodeName(selectedItem)}`
    // let pushStateUrl = `/veracode/${dropDownType}/${formatVeracodeName(selectedItem)}`

    // if (dropDownTypeId === 0) {
    //   dropDownType = 'all'
    //   pushStateUrl = '/veracode'
    // }
    const type = e.target.dataset.typeName
    const dataId = e.target.dataset.associatedSelectId

    const selectedItem = $(`#${dataId}`).val()
    console.log(selectedItem)
    if (!selectedItem) {
      return
    }
    let pushStateUrl = `/veracode/${type}/${formatVeracodeName(selectedItem)}`
    window.location = `/veracode/${type}/${formatVeracodeName(selectedItem)}`
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
    data: 'result',
    createdCell: function (td, _cellData, rowData) {
      let className = 'veracode--missing'
      let data = 'N/A'

      if (rowData.hasVeracode) {
        className = rowData.result === 'Passed' ? 'veracode--passed' : 'veracode--failed'
        data = rowData.result
      }

      $(td).html(data).addClass(className)
    },
  },
  {
    data: 'date',
    createdCell: function (td, _cellData, rowData) {
      $(td).html(`${rowData.date}`).addClass('td-nowrap')
    },
  },
  {
    data: 'severityLevels.VERY_HIGH',
    createdCell: function (td, _cellData, rowData) {
      const data = rowData.hasVeracode ? rowData.severityLevels.VERY_HIGH : 'N/A'
      $(td).html(data)
    },
  },
  {
    data: 'severityLevels.HIGH',
    createdCell: function (td, _cellData, rowData) {
      const data = rowData.hasVeracode ? rowData.severityLevels.HIGH : 'N/A'
      $(td).html(data)
    },
  },
  {
    data: 'severityLevels.MEDIUM',
    createdCell: function (td, _cellData, rowData) {
      const data = rowData.hasVeracode ? rowData.severityLevels.MEDIUM : 'N/A'
      $(td).html(data)
    },
  },
  {
    data: 'severityLevels.LOW',
    createdCell: function (td, _cellData, rowData) {
      const data = rowData.hasVeracode ? rowData.severityLevels.LOW : 'N/A'
      $(td).html(data)
    },
  },
  {
    data: 'codeScore',
    createdCell: function (td, _cellData, rowData) {
      const data = rowData.hasVeracode ? rowData.codeScore : 0
      $(td).html(data)
    },
    type: 'num',
  },
  {
    data: 'report',
    createdCell: function (td, _cellData, rowData) {
      const data = rowData.hasVeracode ? `<a href="${rowData.report}" target="_blank">View</a>` : 'N/A'
      $(td).html(data)
    },
  },
]

function formatVeracodeName(name) {
  return `${name} `
    .trim()
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^-a-z0-9]/g, '')
    .replace(/-+/g, '-')
}
