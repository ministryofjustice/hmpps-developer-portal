export type Product = {
  id: number
  name: string
  subproduct: boolean
  legacy: boolean
  description: string
  phase: string
  deliveryManager: string
  productManager: string
  confluenceLink: string
  gDriveLink: string
  productId: string
  slackChannelId: string
  slug: string
  slackChannelName: string
  leadDeveloper: string
}

export type ServiceArea = {
  id: number
  name: string
  owner: string
  serviceAreaId: string
  slug: string
  products: Product[]
}
