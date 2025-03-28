import { ServiceAreaListResponseDataItem } from '../strapiApiTypes'
import { convertServiceArea } from './serviceArea'

test('check conversion', () => {
  const actual = convertServiceArea(exampleStrapiServiceArea)

  expect(actual).toStrictEqual(createModelServiceArea(123, 'A Service Area name'))
})

export const createModelServiceArea = (id: number, name: string) => ({
  id,
  name,
  owner: 'The Owner',
  serviceAreaId: 'SA01',
  slug: 'a-service-area-name',
  products: [
    {
      confluenceLink: 'https://atlassian.net/wiki/spaces/SOME/overview',
      deliveryManager: 'Delivery Manager',
      description: 'A description of the project',
      gDriveLink: '',
      id: 456,
      leadDeveloper: 'Lead Developer',
      legacy: false,
      name: 'A Product name',
      phase: 'Private Beta',
      productId: 'DPS000',
      productManager: 'Product Manager',
      slackChannelId: 'C01ABC0ABCD',
      slackChannelName: 'some-slack-channel',
      slug: 'a-product-name-1',
      subproduct: false,
    },
  ],
})

export const exampleStrapiServiceArea: ServiceAreaListResponseDataItem = {
  id: 123,
  attributes: {
    name: 'A Service Area name',
    owner: 'The Owner',
    createdAt: '2023-07-04T10:44:59.491Z',
    updatedAt: '2025-03-28T09:33:19.417Z',
    publishedAt: '2023-07-04T10:44:59.489Z',
    sa_id: 'SA01',
    slug: 'a-service-area-name',
    products: {
      data: [
        {
          id: 456,
          attributes: {
            name: 'A Product name',
            subproduct: false,
            legacy: false,
            description: 'A description of the project',
            phase: 'Private Beta',
            delivery_manager: 'Delivery Manager',
            product_manager: 'Product Manager',
            confluence_link: 'https://atlassian.net/wiki/spaces/SOME/overview',
            gdrive_link: '',
            createdAt: '2024-06-26T10:09:15.667Z',
            updatedAt: '2025-03-28T09:33:49.200Z',
            publishedAt: '2024-06-26T10:09:15.663Z',
            p_id: 'DPS000',
            slack_channel_id: 'C01ABC0ABCD',
            slug: 'a-product-name-1',
            slack_channel_name: 'some-slack-channel',
            lead_developer: 'Lead Developer',
          },
        },
      ],
    },
  },
}
