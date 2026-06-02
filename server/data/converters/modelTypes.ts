export type Product = {
  id: number
  name: string
  subproduct: boolean
  description: string
  phase: string
  deliveryManager: string
  productManager: string
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

export type Summary = {
  config?: Record<string, number>
  secret?: Record<string, number>
  'os-pkgs'?: {
    fixed?: Record<string, number>
    unfixed?: Record<string, number>
  }
  'lang-pkgs'?: {
    fixed?: Record<string, number>
    unfixed?: Record<string, number>
  }
}
