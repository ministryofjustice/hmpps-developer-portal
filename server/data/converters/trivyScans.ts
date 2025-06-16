/* eslint-disable camelcase */
import { TrivyScanListResponseDataItem } from '../strapiApiTypes'
import type { TrivyScanType, ScanSummary } from './modelTypes'

const convertTrivyScan = (trivyScan: TrivyScanListResponseDataItem): TrivyScanType => {
  const { attributes, id } = trivyScan
  const { name, trivy_scan_timestamp, build_image_tag, scan_status, scan_summary, environments } = attributes

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
