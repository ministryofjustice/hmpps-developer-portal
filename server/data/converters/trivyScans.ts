/* eslint-disable camelcase */
import { TrivyScan } from '../strapiApiTypes'
import type { ScanSummary, TrivyScanType } from '../modelTypes'
import { DataItem } from '../strapiClientTypes'

const convertTrivyScan = (trivyScan: DataItem<TrivyScan>): TrivyScanType => {
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
