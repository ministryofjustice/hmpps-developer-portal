import Page from './page'

export default class ProductSetPage extends Page {
  constructor(productSetName: string) {
    super(`${productSetName}`)
  }
}
