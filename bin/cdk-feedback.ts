#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkFeedbackStack } from '../lib/cdk-feedback-stack';

const app = new cdk.App();
new CdkFeedbackStack(app, 'CdkFeedbackStack');
