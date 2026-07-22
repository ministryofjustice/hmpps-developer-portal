import { createTable, cleanColumnOutput } from './common.js'

if (document.querySelector('#snykCriticalCvesTable')) {
  jQuery(function () {
    let criticalRows = []
    let activeView = 'snyk'
    let selectedSeverities = new Set(['CRITICAL', 'HIGH'])
    let selectedLanguages = new Set()
    let availableLanguages = []
    let table

    const columns = [
      {
        data: 'published_date',
        name: 'published_date',
        createdCell: function (td, _cellData, rowData) {
          const publishedDate = cleanColumnOutput(`${rowData.published_date || ''}`)
          $(td).html(publishedDate || 'N/A')
        },
      },
      {
        data: 'snyk_id',
        name: 'snyk_id',
        createdCell: function (td, _cellData, rowData) {
          const snykIds = `${rowData.snyk_id || ''}`
            .split(',')
            .map(item => cleanColumnOutput(item.trim()))
            .filter(Boolean)

          if (snykIds.length === 0) {
            $(td).html('N/A')
            return
          }

          const renderedSnykIds = snykIds
            .map(snykId => {
              const snykUrl = `https://security.snyk.io/vuln/${encodeURIComponent(snykId)}`
              return `<div><a class="govuk-link--no-visited-state" href="${snykUrl}" target="_blank">${snykId}</a></div>`
            })
            .join('')

          $(td).html(renderedSnykIds)
        },
      },
      {
        data: 'cves',
        name: 'cves',
        createdCell: function (td, _cellData, rowData) {
          const cves = Array.isArray(rowData.cves) ? rowData.cves : []

          if (cves.length === 0) {
            $(td).html('None')
            return
          }

          const rendered = cves
            .map(cve => {
              const safeCve = cleanColumnOutput(`${cve}`.toUpperCase())
              const cveUrl = `https://www.cve.org/CVERecord?id=${encodeURIComponent(safeCve)}`
              return `<div><a class="govuk-link--no-visited-state" href="${cveUrl}" target="_blank">${safeCve}</a></div>`
            })
            .join('')

          $(td).html(rendered)
        },
      },
      {
        data: 'severity',
        name: 'severity',
        createdCell: function (td, _cellData, rowData) {
          const severity = cleanColumnOutput(`${rowData.severity || 'UNKNOWN'}`).toUpperCase()
          $(td).html(severity)
        },
      },
      {
        data: 'affected_package_name',
        name: 'affected_package_name',
        createdCell: function (td, _cellData, rowData) {
          const packageName = cleanColumnOutput(`${rowData.affected_package_name || ''}`)
          $(td).html(packageName || 'N/A')
        },
      },
      {
        data: 'affected_versions',
        name: 'affected_versions',
        createdCell: function (td, _cellData, rowData) {
          const affectedVersions = Array.isArray(rowData.affected_versions) ? rowData.affected_versions : []
          const renderedVersions = affectedVersions
            .map(version => `<div>${cleanColumnOutput(`${version}`)}</div>`)
            .join('')
          $(td).html(affectedVersions.length > 0 ? renderedVersions : 'Not specified')
        },
      },
      {
        data: 'fixed_versions',
        name: 'fixed_versions',
        createdCell: function (td, _cellData, rowData) {
          const fixedVersions = Array.isArray(rowData.fixed_versions) ? rowData.fixed_versions : []
          const renderedVersions = fixedVersions
            .map(version => `<div>${cleanColumnOutput(`${version}`)}</div>`)
            .join('')
          $(td).html(fixedVersions.length > 0 ? renderedVersions : 'Not fixed')
        },
      },
      {
        data: 'affected_components',
        name: 'affected_components',
        createdCell: function (td, _cellData, rowData) {
          const affectedComponents = Array.isArray(rowData.affected_components) ? rowData.affected_components : []
          if (affectedComponents.length === 0) {
            $(td).html('N/A')
            return
          }

          const renderedComponents = affectedComponents
            .map(component => {
              const componentName = cleanColumnOutput(`${component}`)
              const componentUrl = `/components/${encodeURIComponent(componentName)}`
              return `<div><a data-test="component-links" class="govuk-link--no-visited-state" href="${componentUrl}">${componentName}</a></div>`
            })
            .join('')

          $(td).html(renderedComponents)
        },
      },
    ]

    function getLanguageValue(row) {
      const language = `${row.language || ''}`.trim() || 'Unknown'
      return cleanColumnOutput(language)
    }

    function renderLanguageFilters(rows) {
      availableLanguages = [...new Set(rows.map(getLanguageValue))].sort((a, b) => a.localeCompare(b))
      selectedLanguages = new Set(availableLanguages)

      const languageFilterContainer = $('#languageFilterContainer')
      if (availableLanguages.length === 0) {
        languageFilterContainer.html('')
        return
      }

      const languageItems = availableLanguages
        .map(
          language => `
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input" id="languageFilter-${language.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" name="languageFilter" type="checkbox" value="${language}" checked>
              <label class="govuk-label govuk-checkboxes__label" for="languageFilter-${language.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${language}</label>
            </div>`,
        )
        .join('')

      languageFilterContainer.html(`
        <div class="govuk-form-group">
          <fieldset class="govuk-fieldset">
            <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">Language</legend>
            <div class="govuk-checkboxes govuk-checkboxes--inline" data-module="govuk-checkboxes">${languageItems}</div>
          </fieldset>
        </div>
      `)

      $('input[name="languageFilter"]').on('change', function () {
        const selected = $('input[name="languageFilter"]:checked')
          .map(function () {
            return `${$(this).val() || ''}`
          })
          .get()

        selectedLanguages = new Set(selected)

        renderTable(activeView)
      })
    }

    function getFilteredRowsBySeverityAndLanguage() {
      if (selectedSeverities.size === 0) {
        return []
      }

      if (availableLanguages.length > 0 && selectedLanguages.size === 0) {
        return []
      }

      return criticalRows.filter(row => {
        const rowSeverity = `${row.severity || ''}`.toUpperCase()
        const rowLanguage = getLanguageValue(row)
        return selectedSeverities.has(rowSeverity) && (availableLanguages.length === 0 || selectedLanguages.has(rowLanguage))
      })
    }

    function getRowsForView(view) {
      const rowsForSeverity = getFilteredRowsBySeverityAndLanguage()

      if (view === 'cve') {
        const groupedByCve = new Map()

        rowsForSeverity.forEach(row => {
          const snykId = `${row.snyk_id || ''}`
          const cves = Array.isArray(row.cves) ? row.cves : []
          const packageName = `${row.affected_package_name || ''}`.trim()
          const affectedVersions = Array.isArray(row.affected_versions) ? row.affected_versions : []
          const fixedVersions = Array.isArray(row.fixed_versions) ? row.fixed_versions : []
          const affectedComponents = Array.isArray(row.affected_components) ? row.affected_components : []

          cves.forEach(cve => {
            const cveKey = `${cve || ''}`.toUpperCase().trim()
            if (!cveKey) {
              return
            }

            if (!groupedByCve.has(cveKey)) {
              groupedByCve.set(cveKey, {
                snykIds: new Set(),
                severities: new Set(),
                packageNames: new Set(),
                affectedVersions: new Set(),
                fixedVersions: new Set(),
                components: new Set(),
                publishedDates: new Set(),
              })
            }

            const grouped = groupedByCve.get(cveKey)
            grouped.snykIds.add(snykId)
            grouped.severities.add(`${row.severity || 'UNKNOWN'}`.toUpperCase())
            if (packageName) {
              grouped.packageNames.add(packageName)
            }
            affectedVersions.forEach(version => grouped.affectedVersions.add(`${version}`))
            fixedVersions.forEach(version => grouped.fixedVersions.add(`${version}`))
            affectedComponents.forEach(component => grouped.components.add(component))
            if (row.published_date) {
              grouped.publishedDates.add(`${row.published_date}`)
            }
          })
        })

        return [...groupedByCve.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([cve, grouped]) => {
            return {
              published_date: [...grouped.publishedDates].sort((a, b) => a.localeCompare(b)).join(', '),
              snyk_id: [...grouped.snykIds].sort((a, b) => a.localeCompare(b)).join(', '),
              cves: [cve],
              severity: [...grouped.severities].sort((a, b) => a.localeCompare(b)).join(', '),
              affected_package_name: [...grouped.packageNames].sort((a, b) => a.localeCompare(b)).join(', '),
              affected_versions: [...grouped.affectedVersions].sort((a, b) => a.localeCompare(b)),
              fixed_versions: [...grouped.fixedVersions].sort((a, b) => a.localeCompare(b)),
              affected_components: [...grouped.components].sort((a, b) => a.localeCompare(b)),
            }
          })
      }

      return rowsForSeverity
    }

    function renderTable(view) {
      const rows = getRowsForView(view)

      if (!table) {
        table = createTable({
          id: 'snykCriticalCvesTable',
          data: rows,
          orderColumn: 0,
          orderType: 'asc',
          columns,
        })
        return
      }

      table.clear()
      table.rows.add(rows)
      table.draw(false)
    }

    function setActiveView(view) {
      activeView = view
      renderTable(activeView)
    }

    $('input[name="criticalView"]').on('change', function () {
      const selectedView = `${$(this).val() || ''}`
      if (selectedView === 'snyk' || selectedView === 'cve') {
        setActiveView(selectedView)
      }
    })

    $('input[name="severityFilter"]').on('change', function () {
      const selected = $('input[name="severityFilter"]:checked')
        .map(function () {
          return `${$(this).val() || ''}`.toUpperCase()
        })
        .get()

      selectedSeverities = new Set(selected)
      renderTable(activeView)
    })

    $.ajax({
      url: '/snyk-scans/critical-cves/data',
      success: function (data) {
        criticalRows = Array.isArray(data) ? data : []
        renderLanguageFilters(criticalRows)
        setActiveView(activeView)
      },
      error: function () {
        alert('An error occurred when loading Snyk critical references.') // eslint-disable-line no-undef
      },
    })
  })
}
