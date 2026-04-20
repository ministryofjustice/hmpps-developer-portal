/**
 * @global
 * @function accessibleAutocomplete
 */

document.addEventListener('DOMContentLoaded', () => {
  const sourceElement = document.getElementById('autocomplete-source')
  const container = document.getElementById('product-autocomplete-container')
  const form = document.getElementById('add-product-form')
  const hiddenInput = document.getElementById('input-autocomplete')

  if (!sourceElement || !container || !form || !hiddenInput) return

  const source = JSON.parse(sourceElement.textContent)

  accessibleAutocomplete({
    element: container,
    id: 'product-autocomplete',
    source: source,
  })

  form.addEventListener('submit', () => {
    const autoInput = container.querySelector('input')
    if (!autoInput) return
    hiddenInput.value = autoInput.value
  })
})
