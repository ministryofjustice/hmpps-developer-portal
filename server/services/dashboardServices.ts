export interface productList {
  id?: number
  name: string
}

export async function fetchProductList() {
  try {
    const response = await fetch('https://developer-portal-stage.hmpps.service.justice.gov.uk/dashboard/data')
    if (!response.ok) {
      return []
    }

    const productList = (await response.json()) as productList[]
    return productList.map(product => product.name)
  } catch {
    return []
  }
}
