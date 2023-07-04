import { stubFor } from './wiremock'

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/',
    },
    response: {
      status: 204,
    },
  })

export default {
  stubServiceCataloguePing: ping,
}
