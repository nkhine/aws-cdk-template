import { App } from 'aws-cdk-lib';
import { CicdStack } from '../src/cicd';
import { Config } from '../src/config';

const config = new Config('config.yml');
const app = new App();

new CicdStack(app, 'AWS-CDK-Template', {
  dev: config.dev,
  production: config.production,
  githubTokenArn: config.cicd.githubTokenArn,
  repo: config.cicd.repo,
  env: config.cicd.env,
});
