document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('dashboard-user-name')
  const output = document.getElementById('output')
  const initialName = ' '

  if (!input) return

  if (initialName && !input.value) {
    input.value = initialName
  }
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      const value = input.value.trim()

      if (!value) {
        event.preventDefault()

        if (output) {
          output.textContent = 'Please enter a name and press enter'
          throw new Error('Please enter a name')
        }
        return
      }

      if (output) {
        output.textContent = `Name set as: ${value}`
      }
    }
  })
})
