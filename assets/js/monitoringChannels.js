if (document.querySelector('.govuk-summary-card__title-wrapper')) {
  jQuery(function () {
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
          } else if (current.includes('#dps_alerts')) {
            currentCell.style.backgroundColor = '#fef7f7'
            currentCell.style.borderLeft = '4px solid #d4351c'
            currentCell.innerHTML += ' <span style="color: #d4351c; font-weight: bold;">(Legacy - migrate)</span>'
            recommendedCell.style.backgroundColor = '#f3f9f1'
            recommendedCell.style.borderLeft = '4px solid #00703c'
          } else if (current !== recommended && !current.includes('Not configured')) {
            currentCell.style.backgroundColor = '#fef7f7'
            currentCell.style.borderLeft = '4px solid #d4351c'
            recommendedCell.style.backgroundColor = '#f3f9f1'
            recommendedCell.style.borderLeft = '4px solid #00703c'
          }
        }
      })
    }

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

      const suggestedChannels = {
        nonProd: document.querySelector('.govuk-list--bullet li strong')?.textContent.trim() || '',
        prod: document.querySelectorAll('.govuk-list--bullet li strong')[1]?.textContent.trim() || '',
        prodAlt: document.querySelectorAll('.govuk-list--bullet li strong')[2]?.textContent.trim() || '',
      }

      const tableRows = document.querySelectorAll('.govuk-table__body .govuk-table__row')
      let currentComponent = ''

      tableRows.forEach(row => {
        const cells = row.querySelectorAll('.govuk-table__cell')
        if (cells.length >= 4) {
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

    if (
      document.querySelector('[data-test-id="monitoring-recommendations"]') ||
      $('.govuk-summary-card__title:contains("Suggested Channel Structure")').length > 0
    ) {
      setTimeout(() => {
        addCopyButtons()
        highlightChannelDifferences()
        addExportButton()
      }, 100)
    }
  })
}
