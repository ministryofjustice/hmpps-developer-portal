import { stubFor } from './wiremock'

const ping = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/serviceCatalogue/',
    },
    response: {
      status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { status: 'UP' },
    },
  })

export default {
  stubPing: ping,
}
