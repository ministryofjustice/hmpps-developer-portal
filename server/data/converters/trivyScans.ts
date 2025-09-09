/* eslint-disable camelcase */
import { TrivyScan } from '../strapiApiTypes'
import type { ScanSummary, TrivyScanType } from '../modelTypes'

const convertTrivyScan = (trivyScan: TrivyScan): TrivyScanType => {
  const { name, trivy_scan_timestamp, build_image_tag, scan_status, scan_summary, environments, id } = trivyScan

  return {
    id,
    name,
    trivy_scan_timestamp,
    build_image_tag,
    scan_status,
    environments: environments as string[],
    scan_summary: scan_summary as ScanSummary,
  }
}

export default convertTrivyScan
