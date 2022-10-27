import {
  StackProps,
  Stage,
  StageProps,
  SecretValue,
} from 'aws-cdk-lib';

import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';

import { AppEnvConfig, RepoEntry } from './config';
import { GithubSource } from './constructs/github-trigger';
import { AppStack } from './stack';
import TaggingStack from './tagging';


interface CicdStageProps extends StageProps {
  readonly config: AppEnvConfig;
}

class CicdStage extends Stage {
  constructor(scope: Construct, id: string, props: CicdStageProps) {
    super(scope, id, props);

    new AppStack(this, 'AppStack', {
      config: props.config,
      env: props.config.env,
    });
  }
}

interface CicdStackProps extends StackProps {
  readonly githubTokenArn: string;
  readonly repo: RepoEntry;
  readonly dev: AppEnvConfig;
  readonly production: AppEnvConfig;
}

export class CicdStack extends TaggingStack {
  constructor(scope: Construct, id: string, props: CicdStackProps) {
    super(scope, id, props);
    // Webhook trigger code
    const oauthToken = SecretValue.secretsManager(props.githubTokenArn);
    const pipeline = new CodePipeline(this, 'CDKPipeline', {
      dockerEnabledForSynth: true,
      pipelineName: props.repo.pipelineName,
      crossAccountKeys: true,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(
          `${props.repo.owner}/${props.repo.repo}`,
          props.repo.branch,
          {
            authentication: oauthToken,
            trigger: GitHubTrigger.NONE,
          }),
        env: {
          GO_VERSION: '1.19',
        },
        installCommands: [
          'wget https://storage.googleapis.com/golang/go${GO_VERSION}.linux-amd64.tar.gz',
          'tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz',
          'export PATH="/usr/local/go/bin:$PATH" && export GOPATH="$HOME/go" && export PATH="$GOPATH/bin:$PATH"',
        ],
        commands: [
          `cd ./${props.repo.path}`,
          // 'make',

          'yarn install --immutable --immutable-cache --check-cache',
          'npm run build',
          'npx cdk synth',
        ],
        primaryOutputDirectory: `./${props.repo.path}/cdk.out`,
      }),
    });

    pipeline.addStage(
      new CicdStage(this, 'Dev', {
        env: props.dev.env,
        config: props.dev,
      }),
    );

    pipeline.addStage(
      new CicdStage(this, 'Prod', {
        env: props.production.env,
        config: props.production,
      }),
      { pre: [new ManualApprovalStep('Approve Deployment to Production')] },
    );
    pipeline.buildPipeline();

    const ghSource = new GithubSource(this, 'GithubTrigger', {
      branch: props.repo.branch,
      owner: props.repo.owner,
      repo: props.repo.repo,
      filters: [props.repo.path],
      githubTokenArn: props.githubTokenArn,
      codepipeline: pipeline.pipeline,
    });
    ghSource.node.addDependency(pipeline);
  }
}
