/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import StrapiApiClient from './strapiApiClient'

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => ({
  applicationInfo,
  strapiApiClientBuilder: (() => new StrapiApiClient()) as RestClientBuilder<StrapiApiClient>,
})

export type DataAccess = ReturnType<typeof dataAccess>

export { StrapiApiClient, RestClientBuilder }
