import Page from './page'

export default class TeamPage extends Page {
  constructor(teamName: string) {
    super(`${teamName}`)
  }
}
