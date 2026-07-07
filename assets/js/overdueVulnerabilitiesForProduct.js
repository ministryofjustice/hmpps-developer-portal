jQuery(async function () {
  $('#updateServiceArea').on('click', async e => {
    e.preventDefault()
    const serviceAreaSlug = document.getElementById('service-area').value
    window.location = `/overdue-vulnerabilities/${serviceAreaSlug}`
  })
})
