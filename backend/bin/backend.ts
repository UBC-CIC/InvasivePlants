#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { APIStack } from '../lib/api-stack';
import { VpcStack } from '../lib/vpc-stack';
import {DBStack} from '../lib/database-stack';
import {DBFlowStack} from '../lib/dbFlow-stack';

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
