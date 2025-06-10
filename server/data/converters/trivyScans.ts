/* eslint-disable camelcase */
import { TrivyScanListResponseDataItem } from '../strapiApiTypes'
import type { TrivyScan } from './modelTypes'

const convertTrivyScan = (TrivyScan: TrivyScanListResponseDataItem): TrivyScan => {
  const { attributes, id } = TrivyScan
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
