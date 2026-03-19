class UserCookies {
  constructor(userName, expiryDays = 7) {
    if (!userName || typeof userName !== 'string') {
      throw new Error('Name must be a string')
    }
    this.userName = userName
    this.expiryDays = expiryDays
  }
  //Set userName cookie
  setUserName(name) {
    Cookies.set(this.userName, name, { expires: this.expiryDays, path: '/' })
  }

  //Read userName cookie
  getUserName() {
    return Cookies.get(this.userName) || null
  }

  //Delete userName cookie
  deleteUserName() {
    Cookies.remove(this.userName, { path: '/' })
  }
}

//Create instance
const userCookie = new UserCookies('username', 7)

//Event listener
document.addEventListener('DOMContentLoaded', () => {
  // document.getElementById('dashboard-user-name').addEventListener('keydown', (event) => {
  const input = document.getElementById('dashboard-user-name')

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      try {
        const name = input.value.trim()
        userCookie.setUserName()
        document.getElementById('output').textContent = `Name saved: ${name}`
        event.target.value = '' //clear input after saving
      } catch (err) {
        document.getElementById('output').textContent = err.message
      }
    }
  })
})
