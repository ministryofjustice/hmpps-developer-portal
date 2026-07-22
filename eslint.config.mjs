import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['assets/**/*.js', 'esbuild/**/*'],
  extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs', 'esbuild/**/*'],
})
