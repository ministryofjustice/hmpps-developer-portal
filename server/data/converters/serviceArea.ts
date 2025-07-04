/* eslint-disable camelcase */
import { DataItem, StrapiServiceArea, Product as StrapiProduct } from '../strapiApiTypes'
import type { Product, ServiceArea } from './modelTypes'

export const convertServiceArea = (serviceArea: DataItem<StrapiServiceArea>): ServiceArea => {
  const { attributes, id } = serviceArea
  const { name, slug, owner, sa_id, products } = attributes

  const strapiProducts: DataItem<StrapiProduct>[] = products.data
  return {
    id,
    name,
    owner,
    serviceAreaId: sa_id,
    slug,
    products: strapiProducts.map(product => convertProduct(product)),
  }
}

export const convertProduct = (product: DataItem<StrapiProduct>): Product => {
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
