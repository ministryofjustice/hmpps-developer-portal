const teamFilter = document.getElementById('team')
const portfolioFilter = document.getElementById('portfolio')

jQuery(function () {
  let currentFilters = getFiltersFromURL()

  function transformData(data) {
    const transformed = []
    data
      .filter(item => item.scan_status === 'Succeeded')
      .forEach(item => {
        const summary = item.scan_summary?.summary || {}
        const scanResult = item.scan_summary?.scan_result || {}
        const cveIDs = []

        // Extract CVE VulnerabilityID from os-pkgs and lang-pkgs
        scanResult['os-pkgs']
          ?.filter(pkg => pkg.VulnerabilityID)
          .forEach(pkg => {
            if (pkg.PrimaryURL) {
              cveIDs.push(`<a href="${pkg.PrimaryURL}" target="_blank">${pkg.VulnerabilityID}</a>`)
            } else {
              cveIDs.push(pkg.VulnerabilityID)
            }
          })

        scanResult['lang-pkgs']
          ?.filter(pkg => pkg.VulnerabilityID)
          .forEach(pkg => {
            if (pkg.PrimaryURL) {
              cveIDs.push(`<a href="${pkg.PrimaryURL}" target="_blank">${pkg.VulnerabilityID}</a>`)
            } else {
              cveIDs.push(pkg.VulnerabilityID)
            }
          })

        item.environments.forEach(env => {
          transformed.push({
            environment: env,
            name: item.name,
            build_image_tag: item.build_image_tag,
            team: item.team ? item.team : undefined,
            portfolio: item.portfolio ? item.portfolio : undefined,
            trivy_scan_timestamp: item.trivy_scan_timestamp,
            total_fixed_critical:
              (summary?.['os-pkgs']?.fixed?.CRITICAL ?? 0) + (summary?.['lang-pkgs']?.fixed?.CRITICAL ?? 0),
            total_fixed_high: (summary?.['os-pkgs']?.fixed?.HIGH ?? 0) + (summary?.['lang-pkgs']?.fixed?.HIGH ?? 0),
            total_fixed_medium:
              (summary?.['os-pkgs']?.fixed?.MEDIUM ?? 0) + (summary?.['lang-pkgs']?.fixed?.MEDIUM ?? 0),
            total_fixed_low: (summary?.['os-pkgs']?.fixed?.LOW ?? 0) + (summary?.['lang-pkgs']?.fixed?.LOW ?? 0),
            total_fixed_unknown:
              (summary?.['os-pkgs']?.fixed?.UNKNOWN ?? 0) + (summary?.['lang-pkgs']?.fixed?.UNKNOWN ?? 0),
            total_unfixed_critical:
              (summary?.['os-pkgs']?.unfixed?.CRITICAL ?? 0) + (summary?.['lang-pkgs']?.unfixed?.CRITICAL ?? 0),
            total_unfixed_high:
              (summary?.['os-pkgs']?.unfixed?.HIGH ?? 0) + (summary?.['lang-pkgs']?.unfixed?.HIGH ?? 0),
            total_unfixed_medium:
              (summary?.['os-pkgs']?.unfixed?.MEDIUM ?? 0) + (summary?.['lang-pkgs']?.unfixed?.MEDIUM ?? 0),
            total_unfixed_low: (summary?.['os-pkgs']?.unfixed?.LOW ?? 0) + (summary?.['lang-pkgs']?.unfixed?.LOW ?? 0),
            total_unfixed_unknown:
              (summary?.['os-pkgs']?.unfixed?.UNKNOWN ?? 0) + (summary?.['lang-pkgs']?.unfixed?.UNKNOWN ?? 0),
            total_secret_issues:
              (summary?.['secret']?.CRITICAL ?? 0) +
              (summary?.['secret']?.HIGH ?? 0) +
              (summary?.['secret']?.MEDIUM ?? 0) +
              (summary?.['secret']?.LOW ?? 0),
            result_link: `
                <a href="/trivy-scans/${item.name}/environments/${env}">
                  <img src="/assets/images/trivy.png" alt="Trivy Logo" class="trivy-icon" />
                </a>`,
            cve_ids: cveIDs.join(', '),
          })
        })
      })
    return transformed
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
        const envlink =
          rowData.environment !== 'unknown'
            ? `<a class="govuk-link--no-visited-state"
               href="/components/${rowData.name}/environment/${rowData.environment}"
               data-test="environment">
               ${rowData.environment}
            </a>&nbsp;`
            : 'unknown'
        $(td).html(envlink)
      },
    },
    {
      data: 'result_link',
      name: 'result_link',
      createdCell: function (td, _cellData, rowData) {
        $(td).html(rowData.result_link)
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
      data: 'trivy_scan_timestamp',
      name: 'trivy_scan_timestamp',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const scan_timestamp = rowData?.trivy_scan_timestamp || 'N/A'
        $(td).html(formatDateToDDMONYYYYHH24MMSS(scan_timestamp))
      },
    },
    {
      data: 'total_fixed_critical',
      name: 'total_fixed_critical',
      createdCell: function (td, _cellData, rowData) {
        const totalFixedCritical = rowData?.total_fixed_critical
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
      data: 'total_secret_issues',
      name: 'total_secret_issues',
      createdCell: function (td, _cellData, rowData) {
        const totalSecretIssues = rowData?.total_secret_issues || 0
        $(td).html(totalSecretIssues)
      },
    },
    {
      data: 'cve_ids',
      name: 'cve_ids',
      createdCell: function (td, _cellData, rowData) {
        const cveDetails = rowData.cve_ids
          ? rowData.cve_ids
              .split(', ')
              .map(cve => `<li>${cve}</li>`)
              .join('')
          : 'None'

        if (cveDetails === 'None') {
          $(td).html(cveDetails)
        } else {
          const detailsContent = `
            <details class="govuk-details">
              <summary class="govuk-details__summary">
                <span class="govuk-details__summary-text">CVE IDs</span>
              </summary>
              <div class="govuk-details__text">
                <ul>${cveDetails}</ul>
              </div>
            </details>`
          $(td).html(detailsContent)
        }
      },
    },
  ]

  $.ajax({
    url: '/trivy-scans/data',
    success: function (data) {
      const transformedData = transformData(data)
      filteredTableData = setupDropdown(transformedData)
      createTable({
        id: 'trivyScansTable',
        data: filteredTableData,
        orderColumn: 0,
        orderType: 'asc',
        columns,
      })
      filterForProdTeamOverview()
      updateEnvironmentList()
    },
  })

  function setupDropdown(allData) {
    const uniqueTeams = getUniqueTeams(allData)
    const uniquePortfolio = getUniquePortfolio(allData)
    renderTeamDropdownOptions(uniqueTeams)
    renderPortfolioDropdownOptions(uniquePortfolio)

    // Get filter value from URL
    if (currentFilters.team) {
      teamFilter.value = currentFilters.team
    }
    if (currentFilters.portfolio) {
      portfolioFilter.value = currentFilters.portfolio
    }

    // Store data for future filtering without refetching
    $('#trivyScansTable').data('fullData', allData)

    // Return filtered or full dataset depending on URL param
    if (currentFilters.team) {
      allData.filter(item => item.team === currentFilters.team)
    }
    if (currentFilters.portfolio) {
      allData.filter(item => item.portfolio === currentFilters.portfolio)
    }
    return allData
  }

  // Extracts a set of valid teams
  function getUniqueTeams(data) {
    return [...new Set(data.map(item => item.team).filter(Boolean))]
  }

  // Extracts a set of valid portfolio options
  function getUniquePortfolio(data) {
    return [...new Set(data.map(item => item.portfolio).filter(Boolean))]
  }

  // Populates the #team dropdown with the team list
  function renderTeamDropdownOptions(teams) {
    teamFilter.innerHTML = `<option value="">All teams</option>`
    teams.forEach(team => {
      const option = document.createElement('option')
      option.value = team
      option.textContent = team
      teamFilter.appendChild(option)
    })
  }

  // Populates the #portfolio dropdown with the portfolio list
  function renderPortfolioDropdownOptions(portfolio) {
    portfolioFilter.innerHTML = `<option value="">All (Prisons & Probation)</option>`
    portfolio.forEach(portfolio => {
      const option = document.createElement('option')
      option.value = portfolio
      option.textContent = portfolio
      portfolioFilter.appendChild(option)
    })
  }

  $('.severity').on('change', e => {
    updateRowVisibility('severity')
  })

  $('.vulnerability').on('change', e => {
    updateRowVisibility('vulnerability')
  })

  $('.environments').on('change', e => {
    updateEnvironmentList()
  })

  $('#updateTeam').on('click', function (e) {
    e.preventDefault()
    // Clear portfolio filter
    currentFilters = {
      portfolio: '',
    }
    // Reset selects
    $('#portfolio').val('')
    updateURLParams(currentFilters)
    // Remove portfolio filter and redraw
    updateScansByDropDown()
  })

  $('#updatePortfolio').on('click', function (e) {
    e.preventDefault()
    // Clear teams filter
    currentFilters = {
      teams: '',
    }
    // Reset selects
    $('#team').val('')
    updateURLParams(currentFilters)
    // Remove team filter and redraw
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
    const selectedEnvironments = []
    $('.environments .govuk-checkboxes__input:checked').each((index, e) => {
      const environment = $(e).val()
      if (environmentMapping[environment]) {
        selectedEnvironments.push(...environmentMapping[environment])
      }
    })
    const table = $('#trivyScansTable').DataTable()
    $.fn.dataTable.ext.search = []
    if (selectedEnvironments.length > 0) {
      $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
        const rowEnvironment = data[1]
        return selectedEnvironments.includes(rowEnvironment)
      })
    }
    const scans = table.rows().data().toArray()
    const filteredScans = filterLatestRows(scans)
    table.clear()
    table.rows.add(filteredScans)
    table.draw(false)
  }

  function updateRowVisibility(action) {
    const isAvailableChecked = $('#showAvailable').is(':checked')
    const isUnavailableChecked = $('#showUnavailable').is(':checked')
    const isNoVulnerabilitiesChecked = $('#showNoVulnerabilities').is(':checked')
    const availableColumns = [5, 6, 7, 8, 9]
    const unavailableColumns = [10, 11, 12, 13, 14]
    const severityCheckboxes = [
      '#showSeverityCritical',
      '#showSeverityHigh',
      '#showSeverityMedium',
      '#showSeverityLow',
      '#showSeverityUnknown',
    ]
    const severityColumns = {
      critical: [5, 10], // 'total_fixed_critical', 'total_unfixed_critical'],
      high: [6, 11], // 'total_fixed_high', 'total_unfixed_high'],
      medium: [7, 12], // 'total_fixed_medium', 'total_unfixed_medium'],
      low: [8, 13], // 'total_fixed_low', 'total_unfixed_low'],
      unknown: [9, 14], // 'total_fixed_unknown', 'total_unfixed_unknown'],
    }

    const table = $('#trivyScansTable').DataTable()

    $.fn.dataTable.ext.search.length = 0
    if (isAvailableChecked || isUnavailableChecked || isNoVulnerabilitiesChecked) {
      $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
        const totalFixedSum = availableColumns.reduce((sum, index) => {
          return sum + (parseInt(data[index]) || 0)
        }, 0)

        const totalUnfixedSum = unavailableColumns.reduce((sum, index) => {
          return sum + (parseInt(data[index]) || 0)
        }, 0)
        if (isAvailableChecked && isUnavailableChecked) {
          return totalFixedSum > 0 && totalUnfixedSum > 0
        } else if (isAvailableChecked) {
          return totalFixedSum > 0
        } else if (isUnavailableChecked) {
          return totalUnfixedSum > 0
        } else if (isNoVulnerabilitiesChecked) {
          return totalFixedSum === 0 && totalUnfixedSum === 0
        }
      })
    }

    if (isNoVulnerabilitiesChecked) {
      availableColumns.forEach(column => {
        table.column(`${column}`).visible(false)
      })
      unavailableColumns.forEach(column => {
        table.column(`${column}`).visible(false)
      })
    }

    availableColumns.forEach(column => {
      table.column(`${column}`).visible(isAvailableChecked)
    })
    unavailableColumns.forEach(column => {
      table.column(`${column}`).visible(isUnavailableChecked)
    })

    if (action === 'severity') {
      severityCheckboxes.forEach(checkbox => {
        const severity = $(checkbox).val()
        const isVisible = $(checkbox).is(':checked')
        if (severityColumns[severity]) {
          severityColumns[severity].forEach(column => {
            table.column(`${column}`).visible(isVisible)
          })
        }
      })
    } else {
      severityCheckboxes.forEach(checkbox => {
        $(checkbox).prop('checked', true)
      })
    }
    table.draw(false)
  }

  function updateScansByDropDown(event) {
    const selectedTeam = teamFilter.value
    const selectedPortfolio = portfolioFilter.value
    currentFilters.team = selectedTeam
    currentFilters.portfolio = selectedPortfolio
    updateURLParams(currentFilters)

    // Get original data from the table DOM element
    const fullData = $('#trivyScansTable').data('fullData') || []

    const filtered = selectedTeam
      ? fullData.filter(item => item.team === selectedTeam)
      : selectedPortfolio
        ? fullData.filter(item => item.portfolio === selectedPortfolio)
        : fullData

    const table = $('#trivyScansTable').DataTable()
    table.clear()
    table.rows.add(filtered)
    table.draw()
  }

  //function to select prod only for Trivy Scans on Team Overview page
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
  function filterLatestRows(scans) {
    const groupedScans = new Map()
    scans.forEach(scan => {
      const key = `${scan.name}-${scan.environment}`
      const currentTimestamp = new Date(scan.trivy_scan_timestamp).getTime()

      if (!groupedScans.has(key) || currentTimestamp > new Date(groupedScans.get(key).trivy_scan_timestamp).getTime()) {
        groupedScans.set(key, scan) // Keep only the latest scan
      }
    })

    // Convert the grouped scans back into an array
    return Array.from(groupedScans.values())
  }
})

// function checks url params for applied filters and builds filter object
function getFiltersFromURL() {
  const params = new URLSearchParams(location.search)
  return {
    team: params.get('team') || '',
    portfolio: params.get('portfolio') || '',
  }
}

// add current filters to Url params
function updateURLParams(filters) {
  const params = new URLSearchParams()
  if (filters.team) params.set('team', filters.team)
  if (filters.portfolio) params.set('portfolio', filters.portfolio)

  history.replaceState(null, '', `?${params.toString()}`)
}

function formatDateToDDMONYYYYHH24MMSS(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
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
