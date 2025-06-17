jQuery(function () {
  function transformData(data) {
    const transformed = []
    data.forEach(item => {
      const summary = item.scan_summary?.summary || {}
      item.environments.forEach(env => {
        transformed.push({
          environments: env,
          name: item.name,
          build_image_tag: item.build_image_tag,
          trivy_scan_timestamp: item.trivy_scan_timestamp,
          total_fixed_critical:
            (summary?.['os-pkgs']?.fixed?.CRITICAL ?? 0) + (summary?.['lang-pkgs']?.fixed?.CRITICAL ?? 0),
          total_fixed_high: (summary?.['os-pkgs']?.fixed?.HIGH ?? 0) + (summary?.['lang-pkgs']?.fixed?.HIGH ?? 0),
          total_fixed_medium: (summary?.['os-pkgs']?.fixed?.MEDIUM ?? 0) + (summary?.['lang-pkgs']?.fixed?.MEDIUM ?? 0),
          total_fixed_low: (summary?.['os-pkgs']?.fixed?.LOW ?? 0) + (summary?.['lang-pkgs']?.fixed?.LOW ?? 0),
          total_fixed_unknown:
            (summary?.['os-pkgs']?.fixed?.UNKNOWN ?? 0) + (summary?.['lang-pkgs']?.fixed?.UNKNOWN ?? 0),
          total_unfixed_critical:
            (summary?.['os-pkgs']?.unfixed?.CRITICAL ?? 0) + (summary?.['lang-pkgs']?.unfixed?.CRITICAL ?? 0),
          total_unfixed_high: (summary?.['os-pkgs']?.unfixed?.HIGH ?? 0) + (summary?.['lang-pkgs']?.unfixed?.HIGH ?? 0),
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
              <a href="/trivy-scans/${item.name}">
                <img src="/assets/images/trivy.png" alt="Trivy Logo" style="width: 32px; height: 32px; margin-right: 5px;" />
              </a>`,
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
        $(td).html(`
          <a class="govuk-link--no-visited-state" href="/components/${componentName}">${componentName}</a>
        `)
      },
    },
    {
      name: 'environments',
      data: 'environments',
      createdCell: function (td, _cellData, rowData) {
        const environments = rowData.environments
        $(td).html(environments)
      },
    },
    {
      data: 'build_image_tag',
      name: 'build_image_tag',
      createdCell: function (td, _cellData, rowData) {
        const buildImageTag = rowData?.build_image_tag || 'N/A'
        $(td).html(buildImageTag)
      },
    },
    {
      data: 'trivy_scan_timestamp',
      name: 'trivy_scan_timestamp',
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
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const totalSecretIssues = rowData?.total_secret_issues || 0
        $(td).html(totalSecretIssues)
      },
    },
    {
      data: 'result_link',
      name: 'result_link',
      createdCell: function (td, _cellData, rowData) {
        const componentName = cleanColumnOutput(rowData.name || 'N/A')
        $(td).html(rowData.result_link)
      },
    },
  ]

  $.ajax({
    url: '/trivy-scans/data',
    success: function (data) {
      const transformedData = transformData(data)
      createTable({
        id: 'trivyScansTable',
        data: transformedData,
        orderColumn: 0,
        orderType: 'asc',
        columns,
      })
    },
  })

  $('.severity').on('change', e => {
    updateRowVisibility('severity')
  })

  $('.vulnerability').on('change', e => {
    updateRowVisibility('vulnerability')
  })

  $('.environments').on('change', e => {
    updateEnvironmentList()
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
    table.draw(false)
  }

  function updateRowVisibility(action) {
    const isAvailableChecked = $('#showAvailable').is(':checked')
    const isUnavailableChecked = $('#showUnavailable').is(':checked')
    const isNoVulnerabilitiesChecked = $('#showNoVulnerabilities').is(':checked')
    // const availableColumns = ['total_fixed_critical', 'total_fixed_high', 'total_fixed_medium', 'total_fixed_low', 'total_fixed_unknown']
    const availableColumns = [4, 5, 6, 7, 8]
    // const unavailableColumns = ['total_unfixed_critical', 'total_unfixed_high', 'total_unfixed_medium', 'total_unfixed_low', 'total_unfixed_unknown']
    const unavailableColumns = [9, 10, 11, 12, 13]
    const severityCheckboxes = [
      '#showSeverityCritical',
      '#showSeverityHigh',
      '#showSeverityMedium',
      '#showSeverityLow',
      '#showSeverityUnknown',
    ]
    const severityColumns = {
      critical: [4, 9], // 'total_fixed_critical', 'total_unfixed_critical'],
      high: [5, 10], // 'total_fixed_high', 'total_unfixed_high'],
      medium: [6, 11], // 'total_fixed_medium', 'total_unfixed_medium'],
      low: [7, 12], // 'total_fixed_low', 'total_unfixed_low'],
      unknown: [8, 13], // 'total_fixed_unknown', 'total_unfixed_unknown'],
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
})

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
