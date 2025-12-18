import Page from './page'

export default class EnvironmentPage extends Page {
  constructor(environmentName: string) {
    super(`${environmentName}`)
  }
}
