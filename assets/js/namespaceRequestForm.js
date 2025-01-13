jQuery(function () {
  const githubTeamsField = document.getElementById('allgithub_teams')
  const addTeamButton = document.getElementById('add-team')
  const removeTeamButton = document.getElementById('remove-team')
  const selectedTeamsTextarea = document.getElementById('github_teams')
  const limitrangeCheckbox = document.getElementById('limitrange_checkbox')
  const limitrangeFrame = document.getElementById('limitrange_frame')
  const inputsInFrame = limitrangeFrame.querySelectorAll('input')
  const rdsInstanceCheckbox = document.getElementById('rds_instance_checkbox')
  const rdsSelectInputsInFrame = document.querySelectorAll('#rds_instance_frame select')
  const rdsInputsInFrame = document.querySelectorAll('#rds_instance_frame input')
  const elasticacheCheckbox = document.querySelector('#elasticache_checkbox')
  const elasticacheInputsInFrame = document.querySelectorAll('#elasticache_frame select')

  function updateRemoveButtonState() {
    const selectedTeams = selectedTeamsTextarea.value.split('\n').filter(Boolean)
    removeTeamButton.disabled = selectedTeams.length === 0
  }

  // if (userActionSelect) {
  //   if (userActionSelect.tagName === 'SELECT') {
  //     userActionSelect.addEventListener('change', updateFields)
  //   } else {
  //     const radioButtons = document.querySelectorAll('input[name="user_action"]')
  //     radioButtons.forEach(radio => {
  //       radio.addEventListener('change', updateFields)
  //     })
  //   }
  // }
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

  limitrangeCheckbox.addEventListener('click', function () {
    if (limitrangeCheckbox.checked) {
      inputsInFrame.forEach(input => (input.disabled = false))
    } else {
      inputsInFrame.forEach(input => (input.disabled = true))
    }
  })

  if (limitrangeCheckbox.checked) {
    inputsInFrame.forEach(input => (input.disabled = false))
  } else {
    inputsInFrame.forEach(input => (input.disabled = true))
  }

  rdsInstanceCheckbox.addEventListener('click', function () {
    if (rdsInstanceCheckbox.checked) {
      rdsInputsInFrame.forEach(input => (input.disabled = false))
      rdsSelectInputsInFrame.forEach(input => (input.disabled = false))
    } else {
      rdsInputsInFrame.forEach(input => (input.disabled = true))
      rdsSelectInputsInFrame.forEach(input => (input.disabled = true))
    }
  })

  if (rdsInstanceCheckbox.checked) {
    rdsInputsInFrame.forEach(input => (input.disabled = false))
    rdsSelectInputsInFrame.forEach(input => (input.disabled = false))
  } else {
    rdsInputsInFrame.forEach(input => (input.disabled = true))
    rdsSelectInputsInFrame.forEach(input => (input.disabled = true))
  }

  elasticacheCheckbox.addEventListener('click', function () {
    if (elasticacheCheckbox.checked) {
      elasticacheInputsInFrame.forEach(input => (input.disabled = false))
    } else {
      elasticacheInputsInFrame.forEach(input => (input.disabled = true))
    }
  })

  if (elasticacheCheckbox.checked) {
    elasticacheInputsInFrame.forEach(input => (input.disabled = false))
  } else {
    elasticacheInputsInFrame.forEach(input => (input.disabled = true))
  }

  selectedTeamsTextarea.addEventListener('input', updateRemoveButtonState)

  updateRemoveButtonState()
})
