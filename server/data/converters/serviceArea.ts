/* eslint-disable camelcase */
import { ServiceAreaListResponseDataItem } from '../strapiApiTypes'
import type { Product, ServiceArea } from './modelTypes'

type ServiceAreaProduct = ServiceAreaListResponseDataItem['attributes']['products']['data'][0]
export const convertServiceArea = (serviceArea: ServiceAreaListResponseDataItem): ServiceArea => {
  const { attributes, id } = serviceArea
  const { name, slug, owner, sa_id, products } = attributes

  return {
    id,
    name,
    owner,
    serviceAreaId: sa_id,
    slug,
    products: products?.data.map(product => convertProduct(product)),
  }
}

export const convertProduct = (product: ServiceAreaProduct): Product => {
  const { attributes } = product
  const {
    name,
    p_id,
    slug,
    confluence_link,
    gdrive_link,
    slack_channel_name,
    slack_channel_id,
    lead_developer,
    legacy,
    phase,
    subproduct,
    description,
    delivery_manager,
    product_manager,
  } = attributes
  return {
    id: product.id,
    name,
    subproduct,
    legacy,
    description,
    phase,
    deliveryManager: delivery_manager,
    productManager: product_manager,
    leadDeveloper: lead_developer,
    confluenceLink: confluence_link,
    gDriveLink: gdrive_link,
    productId: p_id,
    slackChannelId: slack_channel_id,
    slug,
    slackChannelName: slack_channel_name,
  }
}
