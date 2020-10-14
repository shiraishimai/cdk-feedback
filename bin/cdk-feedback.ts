#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { MediaLiveDemo } from '../lib/cdk-feedback-stack';


const DEFAULT_MEDIALIV_ROLE_ARN = 'arn:aws:iam::471162862146:role/MediaLiveAccessRole'

const app = new cdk.App();

const env = {
  region:  process.env.CDK_DEFAULT_REGION,
  account:  process.env.CDK_DEFAULT_ACCOUNT,
};


const stack = new cdk.Stack(app, 'CdkMediaLiveDemo', { env })

// create with existing IAM Role
// new MediaLiveDemo(stack, 'MediaLiveDemo', {
//   role: iam.Role.fromRoleArn(stack, 'IamRole', DEFAULT_MEDIALIV_ROLE_ARN),
// });

// create with new IAM Role
new MediaLiveDemo(stack, 'MediaLiveDemo');