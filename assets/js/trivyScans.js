jQuery(function () {
  const columns = [
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        const name = rowData?.name || 'N/A'
        $(td).html(`<a href="/trivy-scans/${name}">${name}</a>`)
      },
    },
    {
      data: 'environments',
      createdCell: function (td, _cellData, rowData) {
        const environments = Array.isArray(rowData?.environments)
          ? rowData.environments.join(', ')
          : 'N/A'
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
      name: 'total_fixed_critical',
      data: null,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osFixedCritical = summary?.["os-pkgs"]?.fixed?.CRITICAL ?? 0
        const langFixedCritical = summary?.["lang-pkgs"]?.fixed?.CRITICAL ?? 0
        const totalFixedCritical = osFixedCritical + langFixedCritical
        $(td).html(totalFixedCritical)
      },
    },
    {
      name: 'total_fixed_high',
      data: null,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osFixedHigh = summary?.['os-pkgs']?.fixed?.HIGH ?? 0
        const langFixedHigh = summary?.['lang-pkgs']?.fixed?.HIGH ?? 0
        const totalFixedHigh = osFixedHigh + langFixedHigh
        $(td).html(totalFixedHigh)
      },
    },
    {
      name: 'total_fixed_medium',
      data: null,
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osFixedMedium = summary?.['os-pkgs']?.fixed?.MEDIUM ?? 0
        const langFixedMedium = summary?.['lang-pkgs']?.fixed?.MEDIUM ?? 0
        const totalFixedMedium = osFixedMedium + langFixedMedium
        $(td).html(totalFixedMedium)
      },
    },
    {
      name: 'total_fixed_low',
      data: null,
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osFixedLow = summary?.['os-pkgs']?.fixed?.LOW ?? 0
        const langFixedLow = summary?.['lang-pkgs']?.fixed?.LOW ?? 0
        const totalFixedLow = osFixedLow + langFixedLow
        $(td).html(totalFixedLow)
      },
    },
    {
      name: 'total_fixed_unknown',
      data: null,
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osFixedUnknown = summary?.['os-pkgs']?.fixed?.UNKNOWN ?? 0
        const langFixedUnknown = summary?.['lang-pkgs']?.fixed?.UNKNOWN ?? 0
        const totalFixedUnknown = osFixedUnknown + langFixedUnknown
        $(td).html(totalFixedUnknown)
      },
    },
    {
      name: 'total_unfixed_critical',
      data: null,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osUnfixedCritical = summary?.['os-pkgs']?.unfixed?.CRITICAL ?? 0
        const langUnfixedCritical = summary?.['lang-pkgs']?.unfixed?.CRITICAL ?? 0
        const totalUnfixedCritical = osUnfixedCritical + langUnfixedCritical
        $(td).html(totalUnfixedCritical)
      },
    },
    {
      name: 'total_unfixed_high',
      data: null,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osUnfixedHigh = summary?.['os-pkgs']?.unfixed?.HIGH ?? 0
        const langUnfixedHigh = summary?.['lang-pkgs']?.unfixed?.HIGH ?? 0
        const totalUnfixedHigh = osUnfixedHigh + langUnfixedHigh
        $(td).html(totalUnfixedHigh)
      },
    },
    {
      name: 'total_unfixed_medium',
      data: null,
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osUnfixedMedium = summary?.['os-pkgs']?.unfixed?.MEDIUM ?? 0
        const langUnfixedMedium = summary?.['lang-pkgs']?.unfixed?.MEDIUM ?? 0
        const totalUnfixedMedium = osUnfixedMedium + langUnfixedMedium
        $(td).html(totalUnfixedMedium)
      },
    },
    {
      name: 'total_unfixed_low',
      data: null,
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osUnfixedLow = summary?.['os-pkgs']?.unfixed?.LOW ?? 0
        const langUnfixedLow = summary?.['lang-pkgs']?.unfixed?.LOW ?? 0
        const totalUnfixedLow= osUnfixedLow + langUnfixedLow
        $(td).html(totalUnfixedLow)
      },
    },
    {
      name: 'total_unfixed_unknown',
      data: null,
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.scan_summary?.summary || {}
        const osUnfixedUnknown = summary?.['os-pkgs']?.unfixed?.UNKNOWN ?? 0
        const langUnfixedUnknown = summary?.['lang-pkgs']?.ununfixed?.UNKNOWN ?? 0
        const totalUnfixedUnknown = osUnfixedUnknown + langUnfixedUnknown
        $(td).html(totalUnfixedUnknown)
      },
    },
    {
      name: 'total_config_issues',
      data: null,
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const config_summary = rowData?.scan_summary?.summary?.config || {}
        const totalConfigIssues =
          (config_summary.LOW ?? 0) +
          (config_summary.MEDIUM ?? 0) +
          (config_summary.HIGH ?? 0) +
          (config_summary.CRITICAL ?? 0)
        $(td).html(totalConfigIssues)
      },
    },
    {
      name: 'total_secret_issues',
      data: null,
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const secret_summary = rowData?.scan_summary?.summary?.secret ?? {}
        const totalSecretIssues =
          (secret_summary.LOW ?? 0) +
          (secret_summary.MEDIUM ?? 0) +
          (secret_summary.HIGH ?? 0) +
          (secret_summary.CRITICAL ?? 0)
        $(td).html(totalSecretIssues)
      },
    },
  ]

  const table = createTable({
    id: 'trivyScansTable',
    ajaxUrl: '/trivy-scans/data',
    orderColumn: 0,
    orderType: 'asc',
    columns,
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
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  $('#showAvailable').on('click', function () {
    const isVisible = $(this).is(':checked')

    Object.keys(severityColumns).forEach(severity => {
      const isSeveritySelected = $(`#showSeverity${capitalize(severity)}`).is(':checked')
      const column = `total_fixed_${severity}`
      table.column(`${column}:name`).visible(isVisible && isSeveritySelected)
    })
  })

  $('#showUnavailable').on('click', function () {
    const isVisible = $(this).is(':checked')

    Object.keys(severityColumns).forEach(severity => {
      const isSeveritySelected = $(`#showSeverity${capitalize(severity)}`).is(':checked')
      const column = `total_unfixed_${severity}`

      table.column(`${column}:name`).visible(isVisible && isSeveritySelected)
    })
  })

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
