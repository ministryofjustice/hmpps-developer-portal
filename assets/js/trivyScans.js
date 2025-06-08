jQuery(function () {
  const columns = [
    {
      data: 'type',
      createdCell: function (td, _cellData, rowData) {
        const name = rowData?.attributes?.type
        $(td).html(name)
      },
    },
    {
      data: 'name',
      createdCell: function (td, _cellData, rowData) {
        const name = rowData?.attributes?.trivy_scan?.data?.attributes?.name || 'N/A'
        $(td).html(name)
      },
    },
    {
      data: 'build_image_tag',
      createdCell: function (td, _cellData, rowData) {
        const buildImageTag = rowData?.attributes?.trivy_scan?.data?.attributes?.build_image_tag || 'N/A'
        $(td).html(buildImageTag)
      },
    },
    {
      data: 'attributes.trivy_scan.data.attributes.trivy_scan_timestamp',
      createdCell: function (td, _cellData, rowData) {
        const scan_timestamp = rowData?.attributes?.trivy_scan?.data?.attributes?.trivy_scan_timestamp || 'N/A'
        $(td).html(scan_timestamp)
      },
    },
    {
      data: 'fixed_critical',
      name: 'fixed_critical',
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_fixed_critical = summary?.['os-pkgs']?.fixed?.CRITICAL ?? 0
        const lang_fixed_critical = summary?.['lang-pkgs']?.fixed?.CRITICAL ?? 0
        const value = os_fixed_critical + lang_fixed_critical
        $(td).html(`${value}`)
      },
    },
    {
      data: 'fixed_high',
      name: 'fixed_high',
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_fixed_high = summary?.['os-pkgs']?.fixed?.HIGH ?? 0
        const lang_fixed_high = summary?.['lang-pkgs']?.fixed?.HIGH ?? 0
        const value = os_fixed_high + lang_fixed_high
        $(td).html(`${value}`)
      },
    },
    {
      data: 'fixed_medium',
      name: 'fixed_medium',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_fixed_medium = summary?.['os-pkgs']?.fixed?.MEDIUM ?? 0
        const lang_fixed_medium = summary?.['lang-pkgs']?.fixed?.MEDIUM ?? 0
        const value = os_fixed_medium + lang_fixed_medium
        $(td).html(`${value}`)
      },
    },
    {
      data: 'fixed_low',
      name: 'fixed_low',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_fixed_low = summary?.['os-pkgs']?.fixed?.LOW ?? 0
        const lang_fixed_low = summary?.['lang-pkgs']?.fixed?.LOW ?? 0
        const value = os_fixed_low + lang_fixed_low
        $(td).html(`${value}`)
      },
    },
    {
      data: 'fixed_unknown',
      name: 'fixed_unknown',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_fixed_unknown = summary?.['os-pkgs']?.fixed?.UNKNOWN ?? 0
        const lang_fixed_unknown = summary?.['lang-pkgs']?.fixed?.UNKNOWN ?? 0
        value = os_fixed_unknown + lang_fixed_unknown
        $(td).html(`${value}`)
      },
    },
    {
      data: 'unfixed_critical',
      name: 'unfixed_critical',
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_unfixed_critical = summary?.['os-pkgs']?.unfixed?.CRITICAL ?? 0
        const lang_unfixed_critical = summary?.['lang-pkgs']?.unfixed?.CRITICAL ?? 0
        const value = os_unfixed_critical + lang_unfixed_critical
        $(td).html(`${value}`)
      },
    },
    {
      data: 'unfixed_high',
      name: 'unfixed_high',
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_unfixed_high = summary?.['os-pkgs']?.unfixed?.HIGH ?? 0
        const lang_unfixed_high = summary?.['lang-pkgs']?.unfixed?.HIGH ?? 0
        const value = os_unfixed_high + lang_unfixed_high
        $(td).html(`${value}`)
      },
    },
    {
      data: 'unfixed_medium',
      name: 'unfixed_medium',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_unfixed_medium = summary?.['os-pkgs']?.unfixed?.MEDIUM ?? 0
        const lang_unfixed_medium = summary?.['lang-pkgs']?.unfixed?.MEDIUM ?? 0
        const value = os_unfixed_medium + lang_unfixed_medium
        $(td).html(`${value}`)
      },
    },
    {
      data: 'unfixed_low',
      name: 'unfixed_low',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_unfixed_low = summary?.['os-pkgs']?.unfixed?.LOW ?? 0
        const lang_unfixed_low = summary?.['lang-pkgs']?.unfixed?.LOW ?? 0
        const value = os_unfixed_low + lang_unfixed_low
        $(td).html(`${value}`)
      },
    },
    {
      data: 'unfixed_unknown',
      name: 'unfixed_unknown',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const summary = rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary.summary || {}
        const os_unfixed_unknown = summary?.['os-pkgs']?.unfixed?.UNKNOWN ?? 0
        const lang_unfixed_unknown = summary?.['lang-pkgs']?.ununfixed?.UNKNOWN ?? 0
        value = os_unfixed_unknown + lang_unfixed_unknown
        $(td).html(`${value}`)
      },
    },
    {
      data: 'config_issues',
      name: 'config_issues',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const config_summary =
          rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.scan_summary?.summary.config || {}
        const value =
          (config_summary.LOW ?? 0) +
          (config_summary.MEDIUM ?? 0) +
          (config_summary.HIGH ?? 0) +
          (config_summary.CRITICAL ?? 0)
        $(td).html(`${value}`)
      },
    },
    {
      data: 'secret_issues',
      name: 'secret_issues',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const value =
          rowData?.attributes?.trivy_scan?.data?.attributes?.scan_summary?.summary?.['os-pkgs']?.unfixed?.UNKNOWN ?? 0
        $(td).html(`${value}`)
      },
    },
    {
      data: 'team',
      name: 'team',
      visible: false,
      createdCell: function (td, _cellData, rowData) {
        const team =
          rowData?.attributes?.component?.data?.attributes?.product?.data?.attributes?.team?.data?.attributes?.name
        $(td).html(`${team}`)
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
    critical: ['fixed_critical', 'unfixed_critical'],
    high: ['fixed_high', 'unfixed_high'],
    medium: ['fixed_medium', 'unfixed_medium'],
    low: ['fixed_low', 'unfixed_low'],
    unknown: ['fixed_unknown', 'unfixed_unknown'],
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
      const column = `fixed_${severity}`
      table.column(`${column}:name`).visible(isVisible && isSeveritySelected)
    })
  })

  $('#showUnavailable').on('click', function () {
    const isVisible = $(this).is(':checked')

    Object.keys(severityColumns).forEach(severity => {
      const isSeveritySelected = $(`#showSeverity${capitalize(severity)}`).is(':checked')
      const column = `unfixed_${severity}`

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

  $('#team').on('change', function () {
    // Get the selected team
    const selectedTeam = $(this).val()
    console.log(`Selected team: ${selectedTeam}`)
    // Update the DataTable's AJAX URL with the selected team
    table.ajax.url(`/trivy-scans/data?filter[component][product][team][name][$eq]=${selectedTeam}`).load()
  })
})
