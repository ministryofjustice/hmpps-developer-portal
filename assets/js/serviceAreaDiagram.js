import mermaid from '/assets/mermaid.esm.min.mjs'

jQuery(async function () {
  mermaid.initialize({ startOnLoad: false })

  const element = document.querySelector('.service-area-diagram')
  const graphDefinition = document.getElementById('graph-source').innerText

  const { svg } = await mermaid.render('graph-svg', graphDefinition)
  element.innerHTML = svg.replace(/[ ]*max-width:[ 0-9\.]*px;/i, '')
  svgPanZoom('#graph-svg', {
    zoomEnabled: true,
    fit: true,
    center: true,
  })

  const graph = document.getElementById('graph-svg')
  graph.setAttribute('height', '2500px')
  graph.setAttribute('width', '100%')

  $('#updateServiceArea').on('click', async e => {
    e.preventDefault(e)
    const serviceAreaId = document.getElementById('serviceArea').value
    window.location = `/service-areas/${serviceAreaId}/diagram`
  })

  $('#toggleOrientation').on('click', async e => {
    e.preventDefault(e)
    const urlParams = new URLSearchParams(window.location.search)
    const orientation = urlParams.get('orientation') == 'TB' ? 'LR' : 'TB'
    const serviceAreaId = document.getElementById('serviceAreaSlug').value

    window.location = `/service-areas/${serviceAreaId}/diagram?orientation=${orientation}`
  })
})
