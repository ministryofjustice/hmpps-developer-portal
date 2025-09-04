import { Summary, ScanResult, ScanSummary, TrivyScanType, VeracodeResultsSummary } from './modelTypes'

describe('ModelTypes', () => {
  describe('Type Structure Validation', () => {
    it('should validate Summary type structure', () => {
      const validSummary: Summary = {
        config: { critical: 5, high: 10, medium: 15 },
        secret: { high: 2, medium: 3 },
        'os-pkgs': {
          fixed: { critical: 1, high: 2 },
          unfixed: { medium: 5, low: 10 },
        },
        'lang-pkgs': {
          fixed: { high: 3 },
          unfixed: { critical: 2, medium: 8 },
        },
      }

      expect(validSummary).toBeDefined()
      expect(validSummary.config).toEqual({ critical: 5, high: 10, medium: 15 })
      expect(validSummary['os-pkgs']?.fixed).toEqual({ critical: 1, high: 2 })
    })

    it('should validate ScanResult type structure', () => {
      const validScanResult: ScanResult = {
        config: [
          {
            FilePath: '/path/to/config.yaml',
            Severity: 'high',
            LineNumber: '25',
            Description: 'Insecure configuration detected',
            AdditionalContext: 'Additional details about the issue',
          },
        ],
        secret: [
          {
            Severity: 'critical',
            FilePath: '/path/to/secret.env',
            LineNumber: '10',
            Description: 'Hardcoded secret detected',
            AdditionalContext: 'Secret key found in configuration',
          },
        ],
        'os-pkgs': [
          {
            PkgName: 'openssl',
            Severity: 'high',
            Description: 'OpenSSL vulnerability',
            InstalledVersion: '1.1.1',
            FixedVersion: '1.1.1k',
            VulnerabilityID: 'CVE-2021-3712',
            PrimaryURL: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-3712',
          },
        ],
        'lang-pkgs': [
          {
            PkgName: 'lodash',
            Severity: 'medium',
            Description: 'Prototype pollution vulnerability',
            InstalledVersion: '4.17.15',
            FixedVersion: '4.17.21',
            VulnerabilityID: 'CVE-2021-23337',
            PrimaryURL: 'https://nvd.nist.gov/vuln/detail/CVE-2021-23337',
          },
        ],
      }

      expect(validScanResult).toBeDefined()
      expect(validScanResult.config).toHaveLength(1)
      expect(validScanResult['os-pkgs']?.[0].PkgName).toBe('openssl')
      expect(validScanResult['lang-pkgs']?.[0].Severity).toBe('medium')
    })

    it('should validate ScanSummary type structure', () => {
      const validScanSummary: ScanSummary = {
        summary: {
          config: { high: 2, medium: 5 },
          'os-pkgs': {
            fixed: { critical: 1 },
            unfixed: { high: 3 },
          },
        },
        scan_result: {
          config: [
            {
              FilePath: '/app/config.yaml',
              Severity: 'high',
              LineNumber: '15',
              Description: 'Configuration vulnerability',
              AdditionalContext: 'Insecure setting detected',
            },
          ],
        },
      }

      expect(validScanSummary).toBeDefined()
      expect(validScanSummary.summary?.config?.high).toBe(2)
      expect(validScanSummary.scan_result?.config).toHaveLength(1)
    })

    it('should validate TrivyScanType structure', () => {
      const validTrivyScan: TrivyScanType = {
        id: 123,
        name: 'my-application',
        trivy_scan_timestamp: '2023-12-01T10:30:00Z',
        build_image_tag: 'v1.2.3',
        scan_status: 'completed',
        environments: ['dev', 'staging', 'prod'],
        scan_summary: {
          summary: {
            'os-pkgs': {
              fixed: { critical: 2, high: 5 },
              unfixed: { medium: 10, low: 20 },
            },
          },
          scan_result: {
            'os-pkgs': [
              {
                PkgName: 'curl',
                Severity: 'high',
                Description: 'Buffer overflow vulnerability',
                InstalledVersion: '7.68.0',
                FixedVersion: '7.74.0',
                VulnerabilityID: 'CVE-2020-8231',
                PrimaryURL: 'https://curl.se/docs/CVE-2020-8231.html',
              },
            ],
          },
        },
      }

      expect(validTrivyScan).toBeDefined()
      expect(validTrivyScan.id).toBe(123)
      expect(validTrivyScan.environments).toEqual(['dev', 'staging', 'prod'])
      expect(validTrivyScan.scan_summary.scan_result?.['os-pkgs']).toHaveLength(1)
    })

    it('should validate VeracodeResultsSummary structure', () => {
      const validVeracodeResults: VeracodeResultsSummary = {
        'static-analysis': {
          score: 85,
        },
        severity: [
          {
            level: 5,
            category: [
              {
                count: 3,
                severity: 'VERY_high',
                categoryname: 'SQL Injection',
              },
              {
                count: 7,
                severity: 'high',
                categoryname: 'Cross-Site Scripting',
              },
            ],
          },
          {
            level: 4,
            category: [
              {
                count: 12,
                severity: 'medium',
                categoryname: 'Information Leakage',
              },
            ],
          },
        ],
      }

      expect(validVeracodeResults).toBeDefined()
      expect(validVeracodeResults['static-analysis'].score).toBe(85)
      expect(validVeracodeResults.severity).toHaveLength(2)
      expect(validVeracodeResults.severity[0].category[0].severity).toBe('VERY_high')
    })
  })

  describe('Optional Fields and Edge Cases', () => {
    it('should handle Summary with only some optional fields', () => {
      const partialSummary: Summary = {
        config: { high: 5 },
      }

      expect(partialSummary).toBeDefined()
      expect(partialSummary.config?.high).toBe(5)
      expect(partialSummary.secret).toBeUndefined()
      expect(partialSummary['os-pkgs']).toBeUndefined()
    })

    it('should handle empty Summary', () => {
      const emptySummary: Summary = {}

      expect(emptySummary).toBeDefined()
      expect(Object.keys(emptySummary)).toHaveLength(0)
    })

    it('should handle ScanResult with only some scan types', () => {
      const partialScanResult: ScanResult = {
        'os-pkgs': [
          {
            PkgName: 'nginx',
            Severity: 'critical',
            Description: 'Critical vulnerability in nginx',
            InstalledVersion: '1.18.0',
            FixedVersion: '1.20.1',
            VulnerabilityID: 'CVE-2021-23017',
            PrimaryURL: 'https://nginx.org/security_advisories/',
          },
        ],
      }

      expect(partialScanResult).toBeDefined()
      expect(partialScanResult['os-pkgs']).toHaveLength(1)
      expect(partialScanResult.config).toBeUndefined()
      expect(partialScanResult.secret).toBeUndefined()
    })

    it('should handle empty ScanResult', () => {
      const emptyScanResult: ScanResult = {}

      expect(emptyScanResult).toBeDefined()
      expect(Object.keys(emptyScanResult)).toHaveLength(0)
    })

    it('should handle ScanSummary with only summary', () => {
      const summaryOnly: ScanSummary = {
        summary: {
          'lang-pkgs': {
            fixed: { high: 2 },
            unfixed: { medium: 8 },
          },
        },
      }

      expect(summaryOnly).toBeDefined()
      expect(summaryOnly.summary?.['lang-pkgs']?.fixed?.high).toBe(2)
      expect(summaryOnly.scan_result).toBeUndefined()
    })

    it('should handle empty arrays in scan results', () => {
      const emptyArrays: ScanResult = {
        config: [],
        secret: [],
        'os-pkgs': [],
        'lang-pkgs': [],
      }

      expect(emptyArrays).toBeDefined()
      expect(emptyArrays.config).toEqual([])
      expect(emptyArrays['os-pkgs']).toEqual([])
    })
  })

  describe('Complex Nested Structures', () => {
    it('should handle complex TrivyScanType with all fields populated', () => {
      const complexTrivyScan: TrivyScanType = {
        id: 456,
        name: 'complex-microservice',
        trivy_scan_timestamp: '2023-12-15T14:22:33Z',
        build_image_tag: 'v2.1.0-rc1',
        scan_status: 'completed',
        environments: ['dev', 'test', 'staging', 'preprod', 'prod'],
        scan_summary: {
          summary: {
            config: { critical: 1, high: 3, medium: 8, low: 15 },
            secret: { critical: 2, high: 1 },
            'os-pkgs': {
              fixed: { critical: 5, high: 12, medium: 25 },
              unfixed: { high: 2, medium: 8, low: 30 },
            },
            'lang-pkgs': {
              fixed: { critical: 1, high: 4 },
              unfixed: { medium: 6, low: 12 },
            },
          },
          scan_result: {
            config: [
              {
                FilePath: '/app/docker-compose.yml',
                Severity: 'high',
                LineNumber: '42',
                Description: 'Privileged container detected',
                AdditionalContext: 'Container running with elevated privileges',
              },
            ],
            secret: [
              {
                Severity: 'critical',
                FilePath: '/app/.env',
                LineNumber: '5',
                Description: 'AWS access key detected',
                AdditionalContext: 'Hardcoded AWS credentials found',
              },
            ],
            'os-pkgs': [
              {
                PkgName: 'glibc',
                Severity: 'critical',
                Description: 'Buffer overflow in glibc',
                InstalledVersion: '2.31-0ubuntu9.2',
                FixedVersion: '2.31-0ubuntu9.9',
                VulnerabilityID: 'CVE-2021-3326',
                PrimaryURL: 'https://ubuntu.com/security/CVE-2021-3326',
              },
            ],
            'lang-pkgs': [
              {
                PkgName: 'express',
                Severity: 'high',
                Description: 'Denial of Service vulnerability',
                InstalledVersion: '4.17.1',
                FixedVersion: '4.18.2',
                VulnerabilityID: 'CVE-2022-24999',
                PrimaryURL: 'https://github.com/advisories/GHSA-hrpp-h998-j3pp',
              },
            ],
          },
        },
      }

      expect(complexTrivyScan).toBeDefined()
      expect(complexTrivyScan.environments).toHaveLength(5)
      expect(complexTrivyScan.scan_summary.summary?.config?.critical).toBe(1)
      expect(complexTrivyScan.scan_summary.scan_result?.['os-pkgs']).toHaveLength(1)
    })

    it('should handle complex VeracodeResultsSummary with multiple severity levels', () => {
      const complexVeracode: VeracodeResultsSummary = {
        'static-analysis': {
          score: 72,
        },
        severity: [
          {
            level: 5,
            category: [
              {
                count: 2,
                severity: 'VERY_high',
                categoryname: 'SQL Injection',
              },
              {
                count: 1,
                severity: 'VERY_high',
                categoryname: 'Command Injection',
              },
            ],
          },
          {
            level: 4,
            category: [
              {
                count: 8,
                severity: 'high',
                categoryname: 'Cross-Site Scripting',
              },
              {
                count: 3,
                severity: 'high',
                categoryname: 'Path Traversal',
              },
            ],
          },
          {
            level: 3,
            category: [
              {
                count: 15,
                severity: 'medium',
                categoryname: 'Information Leakage',
              },
              {
                count: 7,
                severity: 'medium',
                categoryname: 'Improper Input Validation',
              },
            ],
          },
          {
            level: 2,
            category: [
              {
                count: 25,
                severity: 'low',
                categoryname: 'Code Quality',
              },
            ],
          },
        ],
      }

      expect(complexVeracode).toBeDefined()
      expect(complexVeracode.severity).toHaveLength(4)
      expect(complexVeracode.severity[0].category).toHaveLength(2)
      expect(complexVeracode.severity[3].category[0].count).toBe(25)
    })
  })

  describe('Type Safety Validation', () => {
    it('should enforce required fields in TrivyScanType', () => {
      const trivyScan: TrivyScanType = {
        id: 789,
        name: 'test-service',
        trivy_scan_timestamp: '2023-12-20T09:15:00Z',
        build_image_tag: 'latest',
        scan_status: 'in-progress',
        environments: [],
        scan_summary: {},
      }

      expect(trivyScan.id).toBe(789)
      expect(trivyScan.name).toBe('test-service')
      expect(trivyScan.environments).toEqual([])
      expect(trivyScan.scan_summary).toEqual({})
    })

    it('should validate severity level types in VeracodeResultsSummary', () => {
      const veracodeResults: VeracodeResultsSummary = {
        'static-analysis': {
          score: 0,
        },
        severity: [],
      }

      expect(veracodeResults['static-analysis'].score).toBe(0)
      expect(veracodeResults.severity).toEqual([])
    })

    it('should handle string and number types correctly', () => {
      const scanItem = {
        PkgName: 'test-package',
        Severity: 'high',
        Description: 'Test vulnerability',
        InstalledVersion: '1.0.0',
        FixedVersion: '1.0.1',
        VulnerabilityID: 'TEST-2023-001',
        PrimaryURL: 'https://example.com/vuln',
      }

      expect(typeof scanItem.PkgName).toBe('string')
      expect(typeof scanItem.Severity).toBe('string')
      expect(typeof scanItem.Description).toBe('string')
      expect(scanItem.PkgName.length).toBeGreaterThan(0)
    })
  })
})
