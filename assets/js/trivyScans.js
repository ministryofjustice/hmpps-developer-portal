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
        })
      })
    })
    return transformed
  }

  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        const name = rowData?.name || 'N/A'
        $(td).html(`<a href="/trivy-scans/${name}">${name}</a>`)
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
      createdCell: function (td, _cellData, rowData) {
        const buildImageTag = rowData?.build_image_tag || 'N/A'
        $(td).html(buildImageTag)
      },
    },
    {
      data: 'trivy_scan_timestamp',
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
  ]

  let table
  $.ajax({
    url: '/trivy-scans/data',
    success: function (data) {
      const transformedData = transformData(data)
      table = createTable({
        id: 'trivyScansTable',
        data: transformedData,
        orderColumn: 0,
        orderType: 'asc',
        columns,
      })
    },
  })

  const severityColumns = {
    critical: ['total_fixed_critical', 'total_unfixed_critical'],
    high: ['total_fixed_high', 'total_unfixed_high'],
    medium: ['total_fixed_medium', 'total_unfixed_medium'],
    low: ['total_fixed_low', 'total_unfixed_low'],
    unknown: ['total_fixed_unknown', 'total_unfixed_unknown'],
  }

  function toggleSeverityColumns(severity, isVisible) {
    severityColumns[severity].forEach(column => table.column(`${column}:name`).visible(isVisible))
    updateColumnVisibility()
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function updateColumnVisibility() {
    const isAvailableVisible = $('#showAvailable').is(':checked')
    const isUnavailableVisible = $('#showUnavailable').is(':checked')

    Object.keys(severityColumns).forEach(severity => {
      const isSeveritySelected = $(`#showSeverity${capitalize(severity)}`).is(':checked')

      const availableColumn = `total_fixed_${severity}`
      table.column(`${availableColumn}:name`).visible(isAvailableVisible && isSeveritySelected)

      // Toggle visibility for "unavailable" columns
      const unavailableColumn = `total_unfixed_${severity}`
      table.column(`${unavailableColumn}:name`).visible(isUnavailableVisible && isSeveritySelected)
    })
  }

  // Event listeners for #showAvailable and #showUnavailable
  $('#showAvailable').on('click', updateColumnVisibility)
  $('#showUnavailable').on('click', updateColumnVisibility)

  // Event listeners for severity checkboxes
  $('#showSeverityCritical').on('click', function () {
    toggleSeverityColumns('critical', $(this).is(':checked'))
  })

  $('#showSeverityHigh').on('click', function () {
    toggleSeverityColumns('high', $(this).is(':checked'))
  })

  $('#showSeverityMedium').on('click', function () {
    toggleSeverityColumns('medium', $(this).is(':checked'))
  })

  $('#showSeverityLow').on('click', function () {
    toggleSeverityColumns('low', $(this).is(':checked'))
  })

  $('#showSeverityUnknown').on('click', function () {
    toggleSeverityColumns('unknown', $(this).is(':checked'))
  })

  $('.environments .govuk-checkboxes__input,.status .govuk-checkboxes__input,.area .govuk-checkboxes__input').on(
    'change',
    e => {
      updateEnvironmentList()
    },
  )

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
