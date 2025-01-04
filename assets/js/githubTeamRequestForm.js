function initializeScript() {
  const teamTypeRadios = document.querySelectorAll('input[name="team_type"]')
  const parentTeamSelect = document.getElementById('parent_team_name')

  function toggleParentTeamSelect() {
    const selectedTeamTypeRadio = document.querySelector('input[name="team_type"]:checked')
    if (!selectedTeamTypeRadio) {
      console.error('No team type selected')
      return
    }

    const selectedTeamType = selectedTeamTypeRadio.value
    if (selectedTeamType === 'parent_team') {
      parentTeamSelect.disabled = true
    } else {
      parentTeamSelect.disabled = false
    }
  }

  teamTypeRadios.forEach(radio => {
    radio.addEventListener('change', toggleParentTeamSelect)
  })

  toggleParentTeamSelect()
}

if (document.readyState !== 'loading') {
  initializeScript()
} else {
  document.addEventListener('DOMContentLoaded', initializeScript)
}
