/**
 * @global
 * @function accessibleAutocomplete
 */
document.addEventListener('DOMContentLoaded', () => {
  window.accessibleAutocomplete()
})

const source = JSON.parse(document.getElementById('autocomplete-source').textContent)
const form = document.getElementById('add-product-form')

form.addEventListener('submit', () => {
  const autoInput = document.querySelector('#product-autocomplete-container input')
  if (!autoInput) return
  document.getElementById('input-autocomplete').value = autoInput.value
})

accessibleAutocomplete({
  container: document.getElementById('product-autocomplete-container'),
  inputId: 'product-autocomplete',
  element: document.querySelector('#product-autocomplete-container'),
  id: 'product-autocomplete-container',
  source: source,
})
