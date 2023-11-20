#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { APIStack } from '../lib/api-stack';
import { VpcStack } from '../lib/vpc-stack';
import {DBStack} from '../lib/database-stack';
import {DBFlowStack} from '../lib/dbFlow-stack';
import { FunctionalityStack } from '../lib/functionality-stack';
import { HostStack } from '../lib/host-stack';
// Create application
const app = new cdk.App();

// Create instance of a VPC stack
const vpcStack = new VpcStack(app, 'VpcStack');

// Create instance of a Database stack
const dbStack = new DBStack(app, 'DBStack', vpcStack);

// Create instance of a Database Flow stack
const dbFlowStack = new DBFlowStack(app, 'DBFlowStack', vpcStack, dbStack);

// Create an instance of an API stack
const api = new APIStack(app, 'APIStack', vpcStack, dbStack);

// Create an instance of functionality stack
const functionality = new FunctionalityStack(app, 'FunctionalityStack');

// Create an instance of Host stack
const hostStack = new HostStack(app, 'hostStack', vpcStack, functionality);

// aws cognito-idp sign-up --client-id 7factsbgi05qv66mgbk9cca827 --username visal.social@gmail.com --password 1234Abcd^ --region ca-central-1
// aws cognito-idp admin-confirm-sign-up --user-pool-id ca-central-1_n7qsRCn5x --username visal.social@gmail.com --region ca-central-1
// aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id 7factsbgi05qv66mgbk9cca827 --auth-parameters USERNAME=visal.social@gmail.com,PASSWORD=1234Abcd^ --region ca-central-1