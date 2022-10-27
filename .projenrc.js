const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '2.4.0',
  cdkVersionPinning: false,
  defaultReleaseBranch: 'main',
  name: 'aws-cdk-template',
  description:
    'AWS CDKv2 base template with projen',
  authorName: 'Norman Khine',
  authorEmail: 'norman@khine.net',
  repository:
    'https://github.com/nkhine/aws-cdk-template',
  authorOrganization: 'nkhine',
  entrypoint: 'bin/main.ts',
  licensed: false,
  gitignore: ['!lib/*.ts', '!bin/*.ts'],
  cdkDependencies: [],
  deps: [
    'yaml',
    // '@cloudcomponents/cdk-codepipeline-slack',
  ] /* Runtime dependencies of this module. */,
  devDeps: ['@types/node'] /* Build dependencies for this module. */,
  context: {},
  dependabot: false,
  buildWorkflow: false,
  releaseWorkflow: false,
  github: false,
  jest: false,
});

project.gitignore.removePatterns('/src');
project.gitignore.removePatterns('/bin');
project.tsconfig.compilerOptions.rootDir = 'source';
project.tsconfig.include = ['source/**/*.ts'];

project.compileTask.prependExec('make');
project.cdkConfig.app = 'npx ts-node --prefer-ts-exts bin/main.ts';
project.synth();
