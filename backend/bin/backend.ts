#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { APIStack } from "../lib/api-stack";
import { VpcStack } from "../lib/vpc-stack";
import { DBStack } from "../lib/database-stack";
import { DBFlowStack } from "../lib/dbFlow-stack";
import { FunctionalityStack } from "../lib/functionality-stack";
import { HostStack } from "../lib/host-stack";
import { EcrStack } from "../lib/ecr-stack";
import { WAFStack } from "../lib/waf-stack";

// Create application
const app = new cdk.App();

const stackDefaultSetup = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};

// Create WAF stack for cloudfront
// Run this stack: cdk deploy Create-WAFWebACL --profile <aws-profile-name>
const WAFInstance = new WAFStack(app, `Cloudfront-WAFWebACL`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1", // Limitation adding WAF to cloudfront
  },
  crossRegionReferences: true,
});

// Create instance of a VPC stack
const vpcStack = new VpcStack(app, "VpcStack", stackDefaultSetup);

// Create an instance of functionality stack
const functionality = new FunctionalityStack(
  app,
  "FunctionalityStack",
  stackDefaultSetup
);

// Create instance of a Database stack
const dbStack = new DBStack(app, "DBStack", vpcStack, stackDefaultSetup);

// Create instance of a Database Flow stack
const dbFlowStack = new DBFlowStack(
  app,
  "DBFlowStack",
  vpcStack,
  dbStack,
  stackDefaultSetup
);

// Create an instance of an API stack
const api = new APIStack(
  app,
  "APIStack",
  vpcStack,
  dbStack,
  functionality,
  stackDefaultSetup
);

// Create an instance of ECR stack
const ecrStack = new EcrStack(app, "ECRStack", stackDefaultSetup);

// Create an instance of Host stack
const hostStack = new HostStack(
  app,
  "hostStack",
  vpcStack,
  functionality,
  api,
  ecrStack,
  WAFInstance.WAFwebACL,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    crossRegionReferences: true,
  }
);

/**
 *
 * LOGICAL FLOW OF DEPLOYMENT
 *
 * Initialization (only do it once)
 * cdk bootstrap --profile <aws-profile-name>
 *
 * Create ECR Repo
 *  cdk deploy ECRStack --profile <aws-profile-name>
 *
 * Upload Docker Image to ECR Repo
 *  Follow ECR instruction.
 *
 * Deploy data username
 * aws secretsmanager create-secret --name InvasivePlantsSecrets --secret-string "{\"DB_Username\":\"YOUR-DB-USERNAME\"}"  --profile <your-profile-name>
 *
 * Deploy everything else
 *  cdk deploy --all --parameters hostStack:prefixListID=<your-region-preFixListId> --profile <aws-profile-name>
 */
