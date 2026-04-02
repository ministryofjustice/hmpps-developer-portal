document.addEventListener('DOMContentLoaded', () => {
  const products = document.getElementById('search-products')
  const output = document.getElementById('product-output')
  const productList = document.getElementById('product-list')

  if (products && productList) {
    document.getElementById('add-product-button').addEventListener('click', event => {
      const productValue = products.value.trim()

      if (!productValue) {
        event.preventDefault()
        output.textContent = 'No favourite products chosen'
        return
      }
      output.textContent = 'Adding product...'
    })
  }
})
