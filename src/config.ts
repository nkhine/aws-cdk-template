import * as fs from 'fs';
import * as YAML from 'yaml';

export interface RepoEntry {
  readonly owner: string;
  readonly repo: string;
  readonly branch: string;
  readonly path: string;
  readonly pipelineName: string;
}

export interface Env {
  readonly name: string;
  readonly account: string;
  readonly region: string;
}

export interface BaseAppConfig {
  readonly env: Env;
}

export interface CicdStackConfig extends BaseAppConfig {
  readonly repo: RepoEntry;
  readonly githubTokenArn: string;
}

export interface AppEnvConfig extends BaseAppConfig {

}

export class Config {
  readonly cicd: CicdStackConfig;
  readonly dev: AppEnvConfig;
  readonly production: AppEnvConfig;

  constructor(fileName?: string) {
    const filename = fileName || 'config.yml';
    const file = fs.readFileSync(filename, 'utf-8');

    const yaml = YAML.parse(file);
    this.cicd = yaml.cicd;
    this.dev = yaml.dev;
    this.production = yaml.production;

    console.log(this);
  }
}
