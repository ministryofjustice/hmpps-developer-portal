import Page from './page'

export default class RdsInstancePage extends Page {
  constructor(rdsInstanceName: string) {
    super(`${rdsInstanceName}`)
  }
}
