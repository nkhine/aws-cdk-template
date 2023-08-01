const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.89.0',
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
  deps: [
    'yaml',
    'cdk-aws-lambda-powertools-layer',
  ] /* Runtime dependencies of this module. */,
  devDeps: ['@types/node', 'cdk-dia'] /* Build dependencies for this module. */,
  context: {},
  dependabot: true,
  buildWorkflow: false,
  releaseWorkflow: false,
  github: true,
  jest: false,
  appEntrypoint: 'main.ts',
  buildCommand: 'make',
  clobber: false,
  srcdir: 'bin',
});

project.addTask('gen-dia', {
  cwd: './docs',
  exec: `
    npx cdk-dia --tree ../cdk.out/tree.json  \
      --include AWS-CDK-Template \
      --include AWS-CDK-Template/Dev/AppStack \
      --include AWS-CDK-Template/Prod/AppStack
  `,
});

// Add a new task that runs synth and then gen-dia
project.addTask('synth-and-gen-dia', {
  exec: 'yarn projen synth && yarn projen gen-dia',
});

project.synth();
