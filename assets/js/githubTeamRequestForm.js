jQuery(function () {
  const teamActionSelect = document.getElementById('user_action')
  const teamDescField = document.getElementById('team_description')
  const teamTypeRadios = document.querySelectorAll('input[name="team_type"]')
  const parentTeamSelect = document.getElementById('parent_team_name')
  const githubUsersField = document.getElementById('allgithub_users')
  const addUserButton = document.getElementById('add-user')
  const removeUserButton = document.getElementById('remove-user')
  const selectedUsersTextarea = document.getElementById('github_users')
  const teamNameField = document.getElementById('team_name')

  function updateFields() {
    let selectedValue
    if (teamActionSelect.tagName === 'SELECT') {
      selectedValue = teamActionSelect.value
    } else {
      const checkedRadio = document.querySelector('input[name="user_action"]:checked')
      selectedValue = checkedRadio ? checkedRadio.value : null
    }

    const isAdd = selectedValue === 'Add'

    if (isAdd) {
      teamDescField.readOnly = false
      teamTypeRadios.forEach(radio => {
        radio.disabled = false
      })
    } else {
      teamDescField.readOnly = true
      parentTeamSelect.disabled = true
      teamTypeRadios.forEach(radio => {
        radio.disabled = true
      })
      // updateMemberList()
    }

    updateRemoveButtonState()
  }

  // async function getTeamMembers() {
  //   const githubTeamName = teamNameField.value
  //   const response = await fetch(`/${githubTeamName}/members`)
  //   const memberList = await response.json()
  //   return memberList
  // }

  // async function updateMemberList() {
  //   const memberList = await getTeamMembers()
  //   githubUsersField.value = memberList.join('\n')
  // }

  function updateRemoveButtonState() {
    const selectedUsers = selectedUsersTextarea.value.split('\n').filter(Boolean)
    removeUserButton.disabled = selectedUsers.length === 0
  }

  if (teamActionSelect) {
    if (teamActionSelect.tagName === 'SELECT') {
      teamActionSelect.addEventListener('change', updateFields)
    } else {
      const radioButtons = document.querySelectorAll('input[name="user_action"]')
      radioButtons.forEach(radio => {
        radio.addEventListener('change', updateFields)
      })
    }
  }

  teamTypeRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      const selectedValue = document.querySelector('input[name="team_type"]:checked').value
      const isAdd = teamActionSelect.value === 'Add'
      console.log(selectedValue)
      if (isAdd && selectedValue === 'sub_team') {
        parentTeamSelect.disabled = false
      } else if (isAdd && selectedValue !== 'sub_team') {
        parentTeamSelect.disabled = true
      }
    })
  })

  addUserButton.addEventListener('click', function () {
    const selectedOptions = Array.from(githubUsersField.selectedOptions)
    const selectedUsers = selectedUsersTextarea.value.split('\n').filter(Boolean)

    selectedOptions.forEach(option => {
      if (!selectedUsers.includes(option.text)) {
        selectedUsers.push(option.text)
      }
    })

    selectedUsersTextarea.value = selectedUsers.join('\n')
    updateRemoveButtonState()
  })

  removeUserButton.addEventListener('click', function () {
    const selectedUsers = selectedUsersTextarea.value.split('\n').filter(Boolean)
    if (selectedUsers.length > 0) {
      const removedUser = selectedUsers.pop()
    }
    selectedUsersTextarea.value = selectedUsers.join('\n')
    updateRemoveButtonState()
  })

  selectedUsersTextarea.addEventListener('input', updateRemoveButtonState)

  updateFields()
  updateRemoveButtonState()
})
