/* eslint-disable camelcase */
import { DataItem, TrivyScan } from '../strapiApiTypes'
import type { ScanSummary, TrivyScanType } from './modelTypes'

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
    scan_summary,
  }
}

export default convertTrivyScan
