#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { APIStack } from '../lib/api-stack';

const app = new cdk.App();
new APIStack(app, 'APIStack');
