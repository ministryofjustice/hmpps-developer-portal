jQuery(function () {
  // Copy channel names to clipboard functionality
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showCopyFeedback('Copied to clipboard!')
        })
        .catch(() => {
          fallbackCopyToClipboard(text)
        })
    } else {
      fallbackCopyToClipboard(text)
    }
  }

  function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
      showCopyFeedback('Copied to clipboard!')
    } catch (err) {
      showCopyFeedback('Failed to copy')
    }

    document.body.removeChild(textArea)
  }

  function showCopyFeedback(message) {
    // Create or update feedback element
    let feedback = document.getElementById('copy-feedback')
    if (!feedback) {
      feedback = document.createElement('div')
      feedback.id = 'copy-feedback'
      feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #00703c;
        color: white;
        padding: 10px 15px;
        border-radius: 4px;
        z-index: 9999;
        font-size: 14px;
        transition: opacity 0.3s ease;
      `
      document.body.appendChild(feedback)
    }

    feedback.textContent = message
    feedback.style.opacity = '1'

    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback)
        }
      }, 300)
    }, 2000)
  }

  // Add copy buttons to channel names
  function addCopyButtons() {
    const channelElements = document.querySelectorAll('.govuk-table__cell')

    channelElements.forEach(cell => {
      const text = cell.textContent.trim()
      if (text.startsWith('#') && text.includes('-alerts-')) {
        const copyButton = document.createElement('button')
        copyButton.className = 'govuk-button govuk-button--secondary govuk-!-margin-left-2'
        copyButton.style.cssText = 'padding: 2px 8px; font-size: 12px; min-height: auto;'
        copyButton.textContent = 'Copy'
        copyButton.type = 'button'

        copyButton.addEventListener('click', e => {
          e.preventDefault()
          copyToClipboard(text)
        })

        cell.appendChild(copyButton)
      }
    })

    // Add copy buttons to recommended channels list
    const recommendedChannels = document.querySelectorAll('.govuk-list--bullet li strong')
    recommendedChannels.forEach(strong => {
      const channelName = strong.textContent.trim()
      if (channelName.startsWith('#')) {
        const copyButton = document.createElement('button')
        copyButton.className = 'govuk-button govuk-button--secondary govuk-!-margin-left-2'
        copyButton.style.cssText = 'padding: 2px 8px; font-size: 12px; min-height: auto;'
        copyButton.textContent = 'Copy'
        copyButton.type = 'button'

        copyButton.addEventListener('click', e => {
          e.preventDefault()
          copyToClipboard(channelName)
        })

        strong.parentNode.appendChild(copyButton)
      }
    })
  }

  // Highlight differences between current and recommended channels
  function highlightChannelDifferences() {
    const tableRows = document.querySelectorAll('.govuk-table__body .govuk-table__row')

    tableRows.forEach(row => {
      const cells = row.querySelectorAll('.govuk-table__cell')
      if (cells.length >= 4) {
        const recommendedCell = cells[2]
        const currentCell = cells[3]

        const recommended = recommendedCell.textContent.trim()
        const current = currentCell.textContent.trim()

        if (current === 'Not configured') {
          currentCell.style.backgroundColor = '#fff2d3'
          currentCell.style.borderLeft = '4px solid #ffbf47'
        } else if (current !== recommended && !current.includes('Not configured')) {
          currentCell.style.backgroundColor = '#fef7f7'
          currentCell.style.borderLeft = '4px solid #d4351c'
          recommendedCell.style.backgroundColor = '#f3f9f1'
          recommendedCell.style.borderLeft = '4px solid #00703c'
        }
      }
    })
  }

  // Add export functionality
  function addExportButton() {
    const summaryCard = document.querySelector('.govuk-summary-card__title-wrapper')
    if (summaryCard) {
      const exportButton = document.createElement('button')
      exportButton.className = 'govuk-button govuk-button--secondary'
      exportButton.textContent = 'Export Recommendations'
      exportButton.type = 'button'

      exportButton.addEventListener('click', () => {
        exportRecommendations()
      })

      summaryCard.appendChild(exportButton)
    }
  }

  function exportRecommendations() {
    const teamName = document.querySelector('h1').textContent.trim()
    const recommendations = []

    // Extract channel recommendations
    const suggestedChannels = {
      nonLive: document.querySelector('.govuk-list--bullet li strong')?.textContent.trim() || '',
      live: document.querySelectorAll('.govuk-list--bullet li strong')[1]?.textContent.trim() || '',
    }

    // Extract component recommendations
    const tableRows = document.querySelectorAll('.govuk-table__body .govuk-table__row')
    let currentComponent = ''

    tableRows.forEach(row => {
      const cells = row.querySelectorAll('.govuk-table__cell')
      if (cells.length >= 4) {
        // Check if this row has a component name (rowspan cell)
        if (cells[0].getAttribute('rowspan')) {
          currentComponent = cells[0].textContent.trim()
        }

        const environment = cells[cells.length - 3].textContent.trim()
        const recommended = cells[cells.length - 2].textContent.trim()
        const current = cells[cells.length - 1].textContent.trim()

        recommendations.push({
          component: currentComponent,
          environment: environment,
          recommended: recommended,
          current: current === 'Not configured' ? null : current,
        })
      }
    })

    const exportData = {
      team: teamName,
      suggestedChannels: suggestedChannels,
      recommendations: recommendations,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${teamName.toLowerCase().replace(/\s+/g, '-')}-monitoring-channels.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showCopyFeedback('Recommendations exported!')
  }

  // Initialize all functionality
  if (
    document.querySelector('[data-test-id="monitoring-recommendations"]') ||
    document.querySelector('.govuk-summary-card__title:contains("Suggested Channel Structure")').length > 0
  ) {
    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
      addCopyButtons()
      highlightChannelDifferences()
      addExportButton()
    }, 100)
  }
})
