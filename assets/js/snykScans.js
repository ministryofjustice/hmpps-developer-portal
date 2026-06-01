const teamFilter = document.getElementById('team')
const portfolioFilter = document.getElementById('portfolio')

jQuery(function () {
  let currentFilters = getFiltersFromURL()
  let snykTable
  let selectedEnvironments = []
  let hasCombinedFilter = false

  const availableColumns = [5, 6, 7, 8, 9]
  const unavailableColumns = [10, 11, 12, 13, 14]

  const vulnerabilityFilterState = {
    isAvailableChecked: false,
    isUnavailableChecked: false,
    isNoVulnerabilitiesChecked: false,
  }

  function registerCombinedFilter() {
    if (hasCombinedFilter) {
      return
    }

    $.fn.dataTable.ext.search.push(function (settings, data) {
      if (!settings?.nTable || settings.nTable.id !== 'snykScansTable') {
        return true
      }

      if (selectedEnvironments.length > 0) {
        const rowEnvironment = data[1]
        if (!selectedEnvironments.includes(rowEnvironment)) {
          return false
        }
      }

      const { isAvailableChecked, isUnavailableChecked, isNoVulnerabilitiesChecked } = vulnerabilityFilterState
      if (!(isAvailableChecked || isUnavailableChecked || isNoVulnerabilitiesChecked)) {
        return true
      }

      const totalFixedSum = availableColumns.reduce((sum, index) => {
        return sum + (parseInt(data[index], 10) || 0)
      }, 0)

      const totalUnfixedSum = unavailableColumns.reduce((sum, index) => {
        return sum + (parseInt(data[index], 10) || 0)
      }, 0)

      const hasAvailableVulnerability = totalFixedSum > 0
      const hasUnavailableVulnerability = totalUnfixedSum > 0
      const hasNoVulnerability = !hasAvailableVulnerability && !hasUnavailableVulnerability

      return (
        (isAvailableChecked && hasAvailableVulnerability) ||
        (isUnavailableChecked && hasUnavailableVulnerability) ||
        (isNoVulnerabilitiesChecked && hasNoVulnerability)
      )
    })

    hasCombinedFilter = true
  }

  function extractScans(rawData) {
    const source = Array.isArray(rawData?.data) ? rawData.data : rawData
    if (!Array.isArray(source)) {
      return []
    }

    return source.map(item => {
      if (item && item.attributes) {
        return {
          id: item.id,
          documentId: item.documentId,
          ...item.attributes,
        }
      }
      return item
    })
  }

  const columns = [
    {
      data: 'name',
      name: 'name',
      createdCell: function (td, _cellData, rowData) {
        const componentName = cleanColumnOutput(rowData.name || 'N/A')
        $(td).html(
          componentName.startsWith('hmpps-base-container-images')
            ? componentName
            : `<a class="govuk-link--no-visited-state" href="/components/${componentName}">${componentName}</a>`,
        )
      },
    },
    {
      name: 'environment',
      data: 'environment',
      createdCell: function (td, _cellData, rowData) {
        const envLink =
          rowData.environment !== 'unknown'
            ? `<a class="govuk-link--no-visited-state"
               href="/components/${rowData.name}/environment/${rowData.environment}"
               data-test="environment">
               ${rowData.environment}
            </a>&nbsp;`
            : 'unknown'
        $(td).html(envLink)
      },
    },
    {
      data: 'result_link',
      name: 'result_link',
      createdCell: function (td, _cellData, rowData) {
        const path = `${rowData.result_link || ''}`.trim()
        const safePath = path.startsWith('/snyk-scans/') ? path : ''
        const link = safePath ? `<a class="govuk-link--no-visited-state" href="${safePath}">View</a>` : 'N/A'
        $(td).html(link)
      },
    },
    {
      data: 'build_image_tag',
      name: 'build_image_tag',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const buildImageTag = rowData?.build_image_tag || 'N/A'
        $(td).html(buildImageTag)
      },
    },
    {
      data: 'snyk_scan_timestamp',
      name: 'snyk_scan_timestamp',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const scanTimestamp = rowData?.snyk_scan_timestamp || 'N/A'
        $(td).html(formatDateToDDMONYYYYHH24MMSS(scanTimestamp))
      },
    },
    {
      data: 'total_fixed_critical',
      name: 'total_fixed_critical',
      createdCell: function (td, _cellData, rowData) {
        const totalFixedCritical = rowData?.total_fixed_critical || 0
        $(td).html(totalFixedCritical)
      },
    },
    {
      data: 'total_fixed_high',
      name: 'total_fixed_high',
      createdCell: function (td, _cellData, rowData) {
        const totalFixedHigh = rowData?.total_fixed_high || 0
        $(td).html(totalFixedHigh)
      },
    },
    {
      data: 'total_fixed_medium',
      name: 'total_fixed_medium',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const totalFixedMedium = rowData?.total_fixed_medium || 0
        $(td).html(totalFixedMedium)
      },
    },
    {
      data: 'total_fixed_low',
      name: 'total_fixed_low',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const totalFixedLow = rowData?.total_fixed_low || 0
        $(td).html(totalFixedLow)
      },
    },
    {
      data: 'total_fixed_unknown',
      name: 'total_fixed_unknown',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const totalFixedUnknown = rowData?.total_fixed_unknown || 0
        $(td).html(totalFixedUnknown)
      },
    },
    {
      data: 'total_unfixed_critical',
      name: 'total_unfixed_critical',
      createdCell: function (td, _cellData, rowData) {
        const totalUnfixedCritical = rowData?.total_unfixed_critical || 0
        $(td).html(totalUnfixedCritical)
      },
    },
    {
      data: 'total_unfixed_high',
      name: 'total_unfixed_high',
      createdCell: function (td, _cellData, rowData) {
        const totalUnfixedHigh = rowData?.total_unfixed_high || 0
        $(td).html(totalUnfixedHigh)
      },
    },
    {
      data: 'total_unfixed_medium',
      name: 'total_unfixed_medium',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const totalUnfixedMedium = rowData?.total_unfixed_medium || 0
        $(td).html(totalUnfixedMedium)
      },
    },
    {
      data: 'total_unfixed_low',
      name: 'total_unfixed_low',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const totalUnfixedLow = rowData?.total_unfixed_low || 0
        $(td).html(totalUnfixedLow)
      },
    },
    {
      data: 'total_unfixed_unknown',
      name: 'total_unfixed_unknown',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const totalUnfixedUnknown = rowData?.total_unfixed_unknown || 0
        $(td).html(totalUnfixedUnknown)
      },
    },
    {
      data: 'vulnerability_refs',
      name: 'vulnerability_refs',
      render: function (data, type) {
        if (type === 'filter' || type === 'sort') {
          const vulnerabilityRefs = Array.isArray(data) ? data : []
          return vulnerabilityRefs
            .map(ref => {
              const cves = Array.isArray(ref.cves) ? ref.cves : []
              const cveValues = cves.map(cve => cve?.value || cve).filter(Boolean)
              return [ref.snykId, ...cveValues].filter(Boolean).join(' ')
            })
            .join(' ')
        }
        return ''
      },
      createdCell: function (td, _cellData, rowData) {
        const vulnerabilityRefs = Array.isArray(rowData.vulnerability_refs) ? rowData.vulnerability_refs : []
        const vulnerabilityDetails = vulnerabilityRefs.length > 0
          ? vulnerabilityRefs
            .map(ref => {
              const snykIdText = cleanColumnOutput(ref.snykId || 'N/A')
              const snykLink = ref.snykUrl
                ? `<a href="${ref.snykUrl}" target="_blank">${snykIdText}</a>`
                : snykIdText
              const cves = Array.isArray(ref.cves) ? ref.cves : []
              const cveText = cves.length > 0
                ? cves
                  .map(cve => {
                    const cveValue = cleanColumnOutput(cve?.value || cve || '')
                    return cve?.url ? `<a href="${cve.url}" target="_blank">${cveValue}</a>` : cveValue
                  })
                  .filter(Boolean)
                  .join(', ')
                : 'No CVE'

              return `<li>${snykLink}: ${cveText}</li>`
            })
            .join('')
          : 'None'

        if (vulnerabilityDetails === 'None') {
          $(td).html(vulnerabilityDetails)
        } else {
          const detailsContent = `
            <details class="govuk-details">
              <summary class="govuk-details__summary">
                <span class="govuk-details__summary-text">SNYK IDs</span>
              </summary>
              <div class="govuk-details__text">
                <ul class="govuk-list govuk-list--bullet">${vulnerabilityDetails}</ul>
              </div>
            </details>`
          $(td).html(detailsContent)
        }
      },
    },
  ]

  $.ajax({
    url: '/snyk-scans/data',
    success: function (data) {
      const transformedData = extractScans(data)
      const filteredTableData = setupDropdown(transformedData)
      snykTable = createTable({
        id: 'snykScansTable',
        data: filteredTableData,
        orderColumn: 0,
        orderType: 'asc',
        columns,
      })
      registerCombinedFilter()
      filterForProdTeamOverview()
      updateEnvironmentList()
    },
  })

  function setupDropdown(allData) {
    const uniqueTeams = getUniqueTeams(allData)
    const uniquePortfolio = getUniquePortfolio(allData)
    renderTeamDropdownOptions(uniqueTeams)
    renderPortfolioDropdownOptions(uniquePortfolio)

    if (currentFilters.team && teamFilter) {
      teamFilter.value = currentFilters.team
    }
    if (currentFilters.portfolio && portfolioFilter) {
      portfolioFilter.value = currentFilters.portfolio
    }

    $('#snykScansTable').data('fullData', allData)

    if (currentFilters.team) {
      return allData.filter(item => item.team === currentFilters.team)
    }
    if (currentFilters.portfolio) {
      return allData.filter(item => item.portfolio === currentFilters.portfolio)
    }
    return allData
  }

  function getUniqueTeams(data) {
    return [...new Set(data.map(item => item.team).filter(Boolean))]
  }

  function getUniquePortfolio(data) {
    return [...new Set(data.map(item => item.portfolio).filter(Boolean))]
  }

  function renderTeamDropdownOptions(teams) {
    if (!teamFilter) {
      return
    }

    teamFilter.innerHTML = '<option value="">All teams</option>'
    teams.forEach(team => {
      const option = document.createElement('option')
      option.value = team
      option.textContent = team
      teamFilter.appendChild(option)
    })
  }

  function renderPortfolioDropdownOptions(portfolios) {
    if (!portfolioFilter) {
      return
    }

    portfolioFilter.innerHTML = '<option value="">All (Prisons & Probation)</option>'
    portfolios.forEach(portfolio => {
      const option = document.createElement('option')
      option.value = portfolio
      option.textContent = portfolio
      portfolioFilter.appendChild(option)
    })
  }

  $('.severity').on('change', () => {
    updateRowVisibility('severity')
  })

  $('.vulnerability').on('change', () => {
    updateRowVisibility('vulnerability')
  })

  $('.environments').on('change', () => {
    updateEnvironmentList()
  })

  $('#updateTeam').on('click', function (e) {
    e.preventDefault()
    currentFilters.portfolio = ''
    $('#portfolio').val('')
    updateURLParams(currentFilters)
    updateScansByDropDown()
  })

  $('#updatePortfolio').on('click', function (e) {
    e.preventDefault()
    currentFilters.team = ''
    $('#team').val('')
    updateURLParams(currentFilters)
    updateScansByDropDown()
  })

  function updateEnvironmentList() {
    const environmentMapping = {
      prod: ['prod', 'production', 'Production'],
      preprod: ['preprod', 'Preprod', 'Pre-production', 'Preproduction'],
      stage: ['stage', 'staging'],
      dev: ['dev', 'Dev', 'development', 'Development'],
      unknown: ['unknown'],
      test: ['test', 'uat', 'training', 'test1', 'test2', 'train'],
    }
    selectedEnvironments = []

    $('.environments .govuk-checkboxes__input:checked').each((index, element) => {
      const environment = $(element).val()
      if (environmentMapping[environment]) {
        selectedEnvironments.push(...environmentMapping[environment])
      }
    })

    if (snykTable) {
      snykTable.draw(false)
    }
  }

  function updateRowVisibility(action) {
    const isAvailableChecked = $('#showAvailable').is(':checked')
    const isUnavailableChecked = $('#showUnavailable').is(':checked')
    const isNoVulnerabilitiesChecked = $('#showNoVulnerabilities').is(':checked')

    const severityCheckboxes = [
      '#showSeverityCritical',
      '#showSeverityHigh',
      '#showSeverityMedium',
      '#showSeverityLow',
      '#showSeverityUnknown',
    ]

    const severityColumns = {
      critical: [5, 10],
      high: [6, 11],
      medium: [7, 12],
      low: [8, 13],
      unknown: [9, 14],
    }

    vulnerabilityFilterState.isAvailableChecked = isAvailableChecked
    vulnerabilityFilterState.isUnavailableChecked = isUnavailableChecked
    vulnerabilityFilterState.isNoVulnerabilitiesChecked = isNoVulnerabilitiesChecked

    const showOnlyNoVulnerabilities = isNoVulnerabilitiesChecked && !isAvailableChecked && !isUnavailableChecked
    const shouldShowVulnerabilityColumns = !showOnlyNoVulnerabilities

    availableColumns.forEach(column => {
      if (snykTable) {
        snykTable.column(column).visible(shouldShowVulnerabilityColumns && isAvailableChecked)
      }
    })

    unavailableColumns.forEach(column => {
      if (snykTable) {
        snykTable.column(column).visible(shouldShowVulnerabilityColumns && isUnavailableChecked)
      }
    })

    if (action === 'severity' && shouldShowVulnerabilityColumns) {
      severityCheckboxes.forEach(checkbox => {
        const severity = $(checkbox).val()
        const isVisible = $(checkbox).is(':checked')
        if (severityColumns[severity]) {
          severityColumns[severity].forEach(column => {
            if (snykTable) {
              snykTable.column(column).visible(isVisible)
            }
          })
        }
      })
    }

    if (snykTable) {
      snykTable.draw(false)
    }
  }

  function updateScansByDropDown() {
    const selectedTeam = teamFilter ? teamFilter.value : ''
    const selectedPortfolio = portfolioFilter ? portfolioFilter.value : ''
    currentFilters.team = selectedTeam
    currentFilters.portfolio = selectedPortfolio
    updateURLParams(currentFilters)

    const fullData = $('#snykScansTable').data('fullData') || []
    let filtered

    if (selectedTeam) {
      filtered = fullData.filter(item => item.team === selectedTeam)
    } else if (selectedPortfolio) {
      filtered = fullData.filter(item => item.portfolio === selectedPortfolio)
    } else {
      filtered = fullData
    }

    if (snykTable) {
      snykTable.clear()
      snykTable.rows.add(filtered)
      snykTable.draw()
    }
  }

  function filterForProdTeamOverview() {
    const params = new URLSearchParams(window.location.search)
    const prodCheckBoxId = params.get('checkbox')

    if (prodCheckBoxId) {
      const allEnvCheckboxes = document.querySelectorAll('input[type="checkbox"][name="environment"]')
      allEnvCheckboxes.forEach(checkbox => {
        checkbox.checked = checkbox.id === prodCheckBoxId
      })
    }
  }

})

function getFiltersFromURL() {
  const params = new URLSearchParams(location.search)
  return {
    team: params.get('team') || '',
    portfolio: params.get('portfolio') || '',
  }
}

function updateURLParams(filters) {
  const params = new URLSearchParams()

  if (filters.team) params.set('team', filters.team)
  if (filters.portfolio) params.set('portfolio', filters.portfolio)

  history.replaceState(null, '', `?${params.toString()}`)
}

function formatDateToDDMONYYYYHH24MMSS(dateString) {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(',', '')
    .toUpperCase()
}
