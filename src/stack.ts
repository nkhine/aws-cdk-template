// import * as path from 'path';
import {
  Duration,
  StackProps,
  RemovalPolicy,
} from 'aws-cdk-lib';
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
  BucketAccessControl,
  StorageClass,
} from 'aws-cdk-lib/aws-s3';

import { Construct } from 'constructs';

import { AppEnvConfig } from './config';
import TaggingStack from './tagging';

interface AppStackProps extends StackProps {
  readonly config: AppEnvConfig;
}

export class AppStack extends TaggingStack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    // define resources here...
    const account = TaggingStack.of(this).account;
    const region = TaggingStack.of(this).region;

    const partnerBucket = new Bucket(this, 'partnerBucket', {
      bucketName: `partner-${account}-${region}`,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
    });

    partnerBucket.addLifecycleRule({
      enabled: true,
      transitions: [
        {
          storageClass: StorageClass.INFREQUENT_ACCESS,
          transitionAfter: Duration.days(30),
        },
        {
          storageClass: StorageClass.GLACIER,
          transitionAfter: Duration.days(180),
        },
      ],
      noncurrentVersionTransitions: [
        {
          storageClass: StorageClass.INFREQUENT_ACCESS,
          transitionAfter: Duration.days(30),
        },
        {
          storageClass: StorageClass.GLACIER,
          transitionAfter: Duration.days(180),
        },
      ],
      noncurrentVersionExpiration: Duration.days(360),
    });
    // end resource definitions
  }
}
