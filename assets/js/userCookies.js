document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('dashboard-user-name')

  input.addEventListener('keydown', async event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const value = input.value.trim()
      if (!value) {
        document.getElementById('output').textContent = 'Please enter a name and press enter'
        throw new Error('Please enter a name')
      }
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      try {
        const response = await fetch('/dashboard/name', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ name: value }),
        })
        const data = await response.json()
        document.getElementById('output').textContent = data.message || `Name set as: ${value}`
        input.value = ''
      } catch (err) {
        document.getElementById('output').textContent = err.message
      }
    }
  })
})
