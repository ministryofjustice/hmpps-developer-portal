# hmpps-developer-portal

[![repo standards badge](https://img.shields.io/badge/dynamic/json?color=blue&style=flat&logo=github&label=MoJ%20Compliant&query=%24.result&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-developer-portal)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-github-repositories.html#hmpps-developer-portal 'Link to report')
[![CircleCI](https://circleci.com/gh/ministryofjustice/hmpps-developer-portal/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/hmpps-developer-portal)

A portal to expose useful information to developers.

```mermaid
graph TD
    service-catalogue
    service-catalogue-db[(db)]
    service-catalogue <--> service-catalogue-db

    classDef redis fill:#FF0000;
    redis[(redis)]:::redis
    hmpps-health-ping --> redis
    hmpps-component-dependencies --> redis

    redis -->  hmpps-developer-portal
    service-catalogue -->  hmpps-developer-portal

    hmpps-veracode-discovery --> service-catalogue
    hmpps-github-discovery --> service-catalogue
    hmpps-terraform-discovery --> service-catalogue
```

# Instructions

## Running the app

The easiest way to run the app is to use docker compose to create the service and all dependencies.

`docker-compose pull`

`docker-compose up`

### Dependencies

The app requires:

- hmpps-auth - for authentication
- redis - session store and token caching

## Imported types

The TypeScript types for Strapi are imported via the Open API (Swagger) docs.

This are stored in [`./server/@types/`](./server/@types/). Unfortunately strapi doesn't provide access in the normal way and the documentaion file must first be downloaded from the running service catalogue i.e. `kubectl -n hmpps-portfolio-management-dev cp hmpps-service-catalogue-<PODID>:/opt/app/src/extensions/documentation/documentation/1.0.0/full_documentation.json  ./full_documentation.json`

We can then run the relevant command to create the types file

```
npx openapi-typescript full_documentation.json --output ./server/@types/strapi-api.d.ts
```

The downloaded file will need tidying (e.g. single rather than double quotes, etc):

- `npm run lint-fix` should tidy most of the formatting
- there may be some remaining errors about empty interfaces; these can be fixed be either removing the line or putting `// eslint-disable-next-line @typescript-eslint/no-empty-interface` before.

After updating the types, running the TypeScript complier across the project (`npx tsc`) will show any issues that have been caused by the change.

### Running the app for development

To start the main services excluding the example typescript template app:

`docker-compose up --scale=app=0`

Install dependencies using `npm install`, ensuring you are using `node v18.x` and `npm v9.x`

Note: Using `nvm` (or [fnm](https://github.com/Schniz/fnm)), run `nvm install --latest-npm` within the repository folder to use the correct version of node, and the latest version of npm. This matches the `engines` config in `package.json` and the CircleCI build config.

And then, to build the assets and start the app with nodemon:

`npm run start:dev`

### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

For local running, start a test db, redis, and wiremock instance by:

`docker-compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with nodemon)

And then either, run tests in headless mode with:

`npm run int-test`

Or run tests with the cypress UI:

`npm run int-test-ui`

### Dependency Checks

The template project has implemented some scheduled checks to ensure that key dependencies are kept up to date.
If these are not desired in the cloned project, remove references to `check_outdated` job from `.circleci/config.yml`

### Port forward to redis hosted in Cloud-platform

This is useful to do so you can test changes with real redis data containing health/info/version stream data.

Create a port forward pod:

```bash
kubectl \
  -n hmpps-portfolio-management-dev \
  run port-forward-pod \
  --image=ministryofjustice/port-forward \
  --port=6379 \
  --env="REMOTE_HOST=[redis host]" \
  --env="LOCAL_PORT=6379" \
  --env="REMOTE_PORT=6379"
```

Use kubectl to port-forward to it:

```bash
kubectl \
  -n hmpps-portfolio-management-dev \
  port-forward \
  port-forward-pod 6379:6379
```

Ensure following redis environment variables are set:

```bash
export REDIS_HOST=127.0.0.1
export REDIS_TLS_ENABLED=true
export REDIS_TLS_VERIFICATION=false
export REDIS_AUTH_TOKEN=[access token]
```
