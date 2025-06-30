/* eslint-disable camelcase */
import { DataItem, Env } from '../strapiApiTypes'
import type { EnvironmentType } from './modelTypes'

const convertEnvironments = (environment: DataItem<Env>): EnvironmentType => {
  const { attributes, id } = environment
  const { name, type, namespace, info_path, health_path, url, monitor, active_agencies, swagger_docs,
     ip_allow_list, ip_allow_list_enabled, include_in_subject_access_requests, modsecurity_enabled, modsecurity_snippet, modsecurity_audit_enabled,
    build_image_tag, alert_severity_label, alerts_slack_channel, manually_managed } = attributes

  return {
    id,
    name,
    type, 
    namespace, 
    info_path, 
    health_path, 
    url,
    monitor, 
    active_agencies: active_agencies as string[], 
    swagger_docs,
    ip_allow_list_enabled, 
    ip_allow_list: ip_allow_list ? Object.keys(ip_allow_list) : [], 
    include_in_subject_access_requests, 
    modsecurity_enabled, 
    modsecurity_audit_enabled,
    modsecurity_snippet, 
    build_image_tag, 
    alert_severity_label, 
    alerts_slack_channel, 
    manually_managed
  }
}

export default convertEnvironments 