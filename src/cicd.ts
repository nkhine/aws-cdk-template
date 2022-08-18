import {
  StackProps,
  Stage,
  StageProps,
  SecretValue,
  RemovalPolicy,
  PhysicalName,
} from 'aws-cdk-lib';
import {
  EventAction,
  FilterGroup,
} from 'aws-cdk-lib/aws-codebuild';
import { Artifact } from 'aws-cdk-lib/aws-codepipeline';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';

import { AppEnvConfig, RepoEntry } from './config';
import { AppStack } from './stack';
import TaggingStack from './tagging';
import { WebhookFilteredPipeline } from './webhook-filtered-pipeline';

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
    const sourceArtifact = new Artifact();
    const oauthToken = SecretValue.secretsManager(props.githubTokenArn);

    const key = new Key(this, 'ArtifactsBucketKey', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const bucket = new Bucket(this, 'ArtifactsBucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      bucketName: PhysicalName.GENERATE_IF_NEEDED,
      encryptionKey: key,
    });

    const webhookPipeline = new WebhookFilteredPipeline(this, 'WebhookFilteredDataSharedPipeline', {
      artifactBucket: bucket,
      crossAccountKeys: true,
      pipelineName: props.repo.pipelineName,
      githubSourceActionProps: {
        ...props.repo,
        output: sourceArtifact,
        actionName: 'Pull_Source_Code',
        trigger: GitHubTrigger.NONE,
        oauthToken: oauthToken,
      },
      restartExecutionOnUpdate: true,
      webhookFilters: [
        FilterGroup.inEventOf(EventAction.PUSH)
          .andBranchIs(props.repo.branch)
          .andFilePathIs(props.repo.path),
      ],
    });
    //
    const pipeline = new CodePipeline(this, 'CDKPipeline', {
      codePipeline: webhookPipeline,
      dockerEnabledForSynth: true,
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
  }
}
