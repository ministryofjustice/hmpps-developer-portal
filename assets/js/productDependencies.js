import mermaid from '/assets/mermaid.esm.min.mjs'

jQuery(async function () {
  mermaid.initialize({ startOnLoad: false })

  const element = document.querySelector('.dependency-graph')
  const graphDefinition = document.getElementById('graph-source').innerText

  const { svg } = await mermaid.render('graph-svg', graphDefinition)
  element.innerHTML = svg
  svgPanZoom('#graph-svg', {
    zoomEnabled: true,
    fit: true,
    center: true,
  })

  const graph = document.getElementById('graph-svg')
  graph.setAttribute('height', '1500px')
  graph.setAttribute('width', '100%')

  $('#updateProduct').on('click', async e => {
    e.preventDefault(e)
    const productCode = document.getElementById('product').value
    window.location = `/product-dependencies/${productCode}`
  })
  $('#toggleOrientation').on('click', async e => {
    e.preventDefault(e)
    const urlParams = new URLSearchParams(window.location.search)
    const orientation = urlParams.get('orientation') == 'LR' ? 'TB' : 'LR'
    const productCode = document.getElementById('product').value

    window.location = `/product-dependencies/${productCode}?orientation=${orientation}`
  })
})
