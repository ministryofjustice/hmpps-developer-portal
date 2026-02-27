# Copilot instructions for hmpps-developer-portal

## Architecture (read this first)
- This is a server-rendered Node/TypeScript app: Express + Nunjucks views + page-specific browser JS.
- Request flow is **route -> service -> data client**. Keep route handlers thin and place API/data shaping in services.
- Main layers: `server/routes/*.ts`, `server/services/*.ts`, `server/data/*.ts`.
- Dependency injection is central: `server/services/index.ts` builds shared services and `createApp(services)` wires all routes in `server/app.ts`.
- App Insights must initialize before other imports in data access (`server/data/index.ts`) to preserve instrumentation.

## Key integration boundaries
- Service Catalogue (Strapi-like API) is the primary data source (`server/data/strapiApiClient.ts`).
- Alertmanager is a separate API (`server/data/alertsApiClient.ts`).
- Redis is used for sessions and derived data (team health, dependency data):
  - session middleware: `server/middleware/setUpWebSession.ts`
  - redis client/retry policy: `server/data/redisClient.ts`
  - redis domain operations: `server/services/redisService.ts`
- External HTTP calls should go through `server/data/restClient.ts` for retries, auth, timeouts, and sanitised error logging.

## Frontend/page pattern
- Each page template extends `server/views/partials/layout.njk` and usually loads:
  - `/assets/frontendInit.js` (GOV.UK + MOJ init)
  - `/assets/js/common.js` (shared DataTables helpers)
  - one page script (`assets/js/<page>.js`) that initializes table/render logic.
- Keep page scripts jQuery/DataTables style (existing convention), e.g. `assets/js/products.js`, `assets/js/components.js`.
- Preserve `data-test` attributes in templates for test stability.

## Validation and errors
- Form validation pattern: use `validateRequest(...)` and flash-backed middleware in `server/middleware/setUpValidationMiddleware.ts`.
- Error responses use the shared error handler and sanitisation (`server/errorHandler.ts`, `server/sanitisedError.ts`).

## Developer workflows (repo-specific)
- Use Node `v24.x` and npm `v11.x` (see `package.json` engines).
- Initial setup: `npm run setup`.
- Local dev: `npm run start:dev` (or run deps only with `docker-compose up --scale=app=0`).
- Feature/integration mode: `npm run start-feature` or `npm run start-feature:dev` (loads `feature.env`).
- Build and checks: `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`.
- Cypress integration tests:
  1. `docker-compose -f docker-compose-test.yml up`
  2. Run app in feature mode
  3. `npm run int-test` (or `npm run int-test-ui`)

## Testing conventions to follow
- Route tests mock services and render real Nunjucks pages (`server/routes/*.test.ts` + `server/routes/testutils/appSetup.ts`).
- For HTML assertions use `supertest` + `cheerio` with stable selectors (`data-test`, IDs).
- Cypress uses page objects in `integration_tests/pages` and runs axe checks from `integration_tests/pages/page.ts`.

## Change guidance for AI agents
- Prefer adding/changing logic in services before routes when behavior spans multiple pages/endpoints.
- Reuse utility helpers (`server/utils/utils.ts`, `server/utils/vulnerabilitySummary.ts`) instead of duplicating transforms.
- Keep route URL style kebab-case as used in `server/app.ts` (for example `/product-sets`, `/team-health`, `/github-teams`).
- When adding a new page, implement all three parts together: route + view + `assets/js/<page>.js` (if interactive/table-based).