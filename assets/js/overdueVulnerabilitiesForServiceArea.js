jQuery(async function () {
  const serviceAreaSlug = document.getElementById('service-area').value
  $('#updateServiceArea').on('click', async e => {
    e.preventDefault()
    const newAreaSlug = document.getElementById('service-area').value

    window.location = `/overdue-vulnerabilities/${newAreaSlug}`
  })

  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(
          `<a href="/overdue-vulnerabilities/${serviceAreaSlug}/product/${rowData.slug}" class="govuk-link--no-visited-state">${rowData.name}</a>`,
        )
      },
    },
    {
      data: 'numberOfBreachedComponents',
    },
    {
      data: 'totalComponents',
    },
    {
      data: 'numberOfBreachedVulnerabilities',
    },
  ]

  createTable({
    id: 'products',
    ajaxUrl: `/overdue-vulnerabilities/${serviceAreaSlug}.json`,
    orderColumn: 0,
    orderType: 'asc',
    columns,
    pageLength: 25,
  })
})
