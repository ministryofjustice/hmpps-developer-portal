import { stubFor } from './wiremock'

const ping = (status = 204) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/serviceCatalogue/_health',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        strapi: 'You are so French!',
      },
    },
  })

export default {
  stubPing: ping,
}
