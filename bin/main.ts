import { App } from "aws-cdk-lib";
import { CicdStack } from "../src/cicd";
import { Config } from "../src/config";

const config = new Config("config.yml");
const app = new App();

new CicdStack(app, "AWS-CDK-Template", {
  dev: config.dev,
  production: config.production,
  githubTokenArn: config.cicd.githubTokenArn,
  repo: config.cicd.repo,
  env: config.cicd.env,
  tags: {
    Application: "aws-cdk-template",
    BusinessUnit: "DevOps",
    Description: "AWS CDKv2 base template with projen",
    TechnicalOwner: "norman@khine.net",
    ManagedBy: "nkhine",
    Tier: "Infrastructure",
    
  },
});
