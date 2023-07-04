import { stubFor } from './wiremock'

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/_health',
    },
    response: {
      status: 204,
    },
  })

export default {
  stubStrapiPing: ping,
}
