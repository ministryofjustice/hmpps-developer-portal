export type DependencyList = {
  helm: string[]
  circleci: string[]
}

export type MoJSelectDataItem = {
  value: string
  text: string
  selected: boolean
}

export type TrivyVulnerability = {
  VulnerabilityID: string
  Severity: string
  References: string[]
}

export type TrivyResult = {
  Vulnerabilities: TrivyVulnerability[]
}

export type TrivyScanResults = {
  Results: TrivyResult[]
}

export type TrivyDisplayEntry = {
  name: string
  lastScan: string
  vulnerability: string
  severity: string
  references: string
}
