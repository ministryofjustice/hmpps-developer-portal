jQuery(function () {
  const userActionSelect = document.getElementById('user_action')
  const fullNameField = document.getElementById('full_name')
  const userEmailField = document.getElementById('user_email')
  const githubTeamsField = document.getElementById('allgithub_teams')
  const addTeamButton = document.getElementById('add-team')
  const removeTeamButton = document.getElementById('remove-team')
  const selectedTeamsTextarea = document.getElementById('github_teams')
  const githubUsernameField = document.getElementById('github_username')

  function updateFields() {
    let selectedValue
    if (userActionSelect.tagName === 'SELECT') {
      selectedValue = userActionSelect.value
    } else {
      const checkedRadio = document.querySelector('input[name="user_action"]:checked')
      selectedValue = checkedRadio ? checkedRadio.value : null
    }

    const isAdd = selectedValue === 'Add'
    const isUpdate = selectedValue === 'Update'

    if (isAdd || isUpdate) {
      fullNameField.readOnly = false
      userEmailField.readOnly = false
    } else {
      fullNameField.readOnly = true
      userEmailField.readOnly = true
      updateMemberList()
    }

    updateRemoveButtonState()
  }

  async function getUserTeams() {
    const githubUserName = githubUsernameField.value
    const response = await fetch(`/github-user-requests/${githubUserName}/teams`)
    const teamList = await response.json()
    return teamList
  }

  async function updateMemberList() {
    const teamList = await getUserTeams()
    while (githubTeamsField.options.length > 0) {
      githubTeamsField.remove(0)
    }
    teamList.forEach(team => {
      const option = document.createElement('option')
      option.value = team
      option.text = team
      githubTeamsField.add(option)
    })
  }

  function updateRemoveButtonState() {
    const selectedTeams = selectedTeamsTextarea.value.split('\n').filter(Boolean)
    removeTeamButton.disabled = selectedTeams.length === 0
  }

  if (userActionSelect) {
    if (userActionSelect.tagName === 'SELECT') {
      userActionSelect.addEventListener('change', updateFields)
    } else {
      const radioButtons = document.querySelectorAll('input[name="user_action"]')
      radioButtons.forEach(radio => {
        radio.addEventListener('change', updateFields)
      })
    }
  }

  addTeamButton.addEventListener('click', function () {
    const selectedOptions = Array.from(githubTeamsField.selectedOptions)
    const selectedTeams = selectedTeamsTextarea.value.split('\n').filter(Boolean)

    selectedOptions.forEach(option => {
      if (!selectedTeams.includes(option.text)) {
        selectedTeams.push(option.text)
      }
    })

    selectedTeamsTextarea.value = selectedTeams.join('\n')
    updateRemoveButtonState()
  })

  removeTeamButton.addEventListener('click', function () {
    const selectedTeams = selectedTeamsTextarea.value.split('\n').filter(Boolean)
    if (selectedTeams.length > 0) {
      selectedTeams.pop()
    }
    selectedTeamsTextarea.value = selectedTeams.join('\n')
    updateRemoveButtonState()
  })

  selectedTeamsTextarea.addEventListener('input', updateRemoveButtonState)

  updateFields()
  updateRemoveButtonState()
})