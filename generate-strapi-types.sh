#!/bin/bash

set -euo pipefail

POD_NAME=$(kubectl -n hmpps-portfolio-management-prod get pods -l=app=hmpps-service-catalogue  -o jsonpath='{.items[0].metadata.name }')

echo "Downloading open api docs from ${POD_NAME} to /tmp/full_documentation.json"
kubectl -n hmpps-portfolio-management-prod cp "${POD_NAME}:/opt/app/src/extensions/documentation/documentation/1.0.0/full_documentation.json"  /tmp/full_documentation.json  

echo "Running open api typescript generator"
npx openapi-typescript /tmp/full_documentation.json --alphabetize --output ./server/@types/strapi-api.d.ts

echo "Linting generated types"
npm run lint-fix

echo "Running typecheck"
npm run typecheck

rm /tmp/full_documentation.json
