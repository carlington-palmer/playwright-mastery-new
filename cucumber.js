module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: ['features/support/**/*.ts', 'features/steps/**/*.ts'],
    paths: ['features/**/*.feature'],
    format: ['progress', 'html:cucumber-report.html'],
  },
};