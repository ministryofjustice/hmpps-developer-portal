#!/bin/bash

set -euo pipefail

SWAGGER_URL="https://service-catalogue.hmpps.service.justice.gov.uk/v1/swagger.json"
SWAGGER_OUTPUT="/tmp/full_documentation.json"

echo "Downloading open api docs from ${SWAGGER_URL} to ${SWAGGER_OUTPUT}"
curl --fail --silent --show-error --location "${SWAGGER_URL}" --output "${SWAGGER_OUTPUT}"

echo "Running open api typescript generator"
npx openapi-typescript "${SWAGGER_OUTPUT}" --alphabetize --output ./server/@types/strapi-api.d.ts

echo "Linting generated types"
npm run lint-fix

echo "Running typecheck"
npm run typecheck

rm "${SWAGGER_OUTPUT}"
