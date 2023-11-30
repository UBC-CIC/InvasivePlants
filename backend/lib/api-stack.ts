import {Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Fn } from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';

// Service files import
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secretmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from "aws-cdk-lib/aws-logs";

// Stack import
import { VpcStack } from './vpc-stack';
import { DBStack } from './database-stack';
import { FunctionalityStack } from './functionality-stack';


export class APIStack extends Stack {
    private readonly dbInstance: rds.DatabaseInstance;
    private readonly secretPath: string;
    private readonly rdsProxyEndpoint: string; 
    public readonly stageARN_APIGW: string;
    constructor(scope: Construct, id: string, vpcStack: VpcStack, db: DBStack, functionalityStack: FunctionalityStack, props?: StackProps){
        super(scope, id, props);

        /**
         * 
         * Load OpenAPI file into API Gateway using REST API
         */
        // Read OpenAPI file and load file to S3
        const asset = new Asset(this, 'SampleAsset', {
            path: 'OpenAPI_Swagger_Definition.yaml',
        });

        // Perform transformation on the file from the S3 location
        const data = Fn.transform('AWS::Include', {'Location': asset.s3ObjectUrl});

        // Create API Gateway
        const api = new apigateway.SpecRestApi(this, 'APIGateway', {
            apiDefinition: apigateway.AssetApiDefinition.fromInline(data),
            endpointTypes: [apigateway.EndpointType.REGIONAL],
            restApiName: "InvasiveSpeciesAPI",
            deploy: true,
            cloudWatchRole: true,
            deployOptions: {
              metricsEnabled: true,
              loggingLevel: apigateway.MethodLoggingLevel.ERROR,
              dataTraceEnabled: true,
              stageName: 'prod',
              methodOptions: {
                "/*/*": {
                  throttlingRateLimit: 100,
                  throttlingBurstLimit: 200
                }
              }
            },
        });

        this.stageARN_APIGW = api.deploymentStage.stageArn;
        
        // Attach API Key to the api
        const apiKey = api.addApiKey('APIKey');

        // API Usage Plan
        const APIPlan = api.addUsagePlan('API-Usage-Plan');

        APIPlan.addApiStage({stage: api.deploymentStage});
        APIPlan.addApiKey(apiKey);

        // Create a deafult CORS Policy
        api.root.addCorsPreflight({
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS
        });

        // Source Code: https://stackoverflow.com/questions/62179893/aws-cdk-how-to-create-an-api-gateway-backed-by-lambda-from-openapi-spec
        // https://medium.com/@gwieser/solving-a-nightmare-aws-cdk-openapi-and-api-gateway-a1b6fdc1fd24 

        /**
         * 
         * Create Integration Lambda layer for PSQL
         */ 
        const postgres = new lambda.LayerVersion(this, 'postgres', {
            code: lambda.Code.fromAsset('./lambda/layers/postgres.zip'),
            compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
            description: 'Contains the postgres library for JS',
        });

        /**
         * 
         * Create an IAM role for lambda function to assume to get access to database
         */
        //Create a role for lambda to access the postgresql database
        const lambdaRole = new iam.Role(this, "postgresLambdaRole", {
            roleName: "postgresLambdaRole",
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        });

        // Grant access to EC2
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface",
                "ec2:AssignPrivateIpAddresses",
                "ec2:UnassignPrivateIpAddresses",
              ],
              resources: ["*"], // must be *
            })
        );

        // Grant access to Secret Manager
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                //Secrets Manager
                "secretsmanager:GetSecretValue",
              ],
              resources: [
                `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
              ],
            })
        );

        // Grant access to log
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                //Logs
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: ["arn:aws:logs:*:*:*"],
            })
        );

        /**
         * 
         * Create Integration Lambda for Region API Gateway endpoint
         */
        const IL_Region = new lambda.Function(this, 'IntegLambRegion', {
            runtime: lambda.Runtime.NODEJS_16_X,    // Execution environment
            code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
            handler: 'regionFunction.handler',         // Code handler
            timeout: Duration.seconds(300),
            vpc: vpcStack.vpc,
            environment: {
                SM_DB_CREDENTIALS: db.secretPath,
                RDS_PROXY_ENDPOINT: db.rdsProxyEndpoint
              },
            functionName: "IntegLambRegion",
            memorySize: 512,
            layers: [postgres],
            role: lambdaRole
        });

        // Add the permission to the Lambda function's policy to allow API Gateway access
        IL_Region.addPermission('AllowApiGatewayInvoke', {
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/region*`
        });
        
        // Change Logical ID to match the one decleared in YAML file of Open API
        const cfnLambda_region = IL_Region.node.defaultChild as lambda.CfnFunction;
        cfnLambda_region.overrideLogicalId("IntegLambRegion");

        /**
         * 
         * Create Integration Lambda for Invasive Species API Gateway endpoint
         */
        const IL_InvasiveSpecies = new lambda.Function(this, 'IntegLambInvasiveSpecies', {
            runtime: lambda.Runtime.NODEJS_16_X,    // Execution environment
            code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
            handler: 'invasiveSpeciesFunction.handler',         // Code handler
            timeout: Duration.seconds(300),
            vpc: vpcStack.vpc,
            environment: {
                SM_DB_CREDENTIALS: db.secretPath,
                RDS_PROXY_ENDPOINT: db.rdsProxyEndpoint
            },
            functionName: "IntegLambInvasiveSpecies",
            memorySize: 512,
            layers: [postgres],
            role: lambdaRole
        });

        // Add the permission to the Lambda function's policy to allow API Gateway access
        IL_InvasiveSpecies.addPermission('AllowApiGatewayInvoke', {
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/invasiveSpecies*`
            // Note: the /*/*/invasiveSpecies*` means allows any stage and method where path includes invasiveSpecies 
        });
        
        // Change Logical ID to match the one decleared in YAML file of Open API
        const cfnLambda_invasiveSpecies = IL_InvasiveSpecies.node.defaultChild as lambda.CfnFunction;
        cfnLambda_invasiveSpecies.overrideLogicalId("IntegLambInvasiveSpecies");

        /**
         * 
         * Create Integration Lambda for Alternative Species API Gateway endpoint
         */
        const IL_alternativeSpecies = new lambda.Function(this, 'IntegLambAlternativeSpecies', {
            runtime: lambda.Runtime.NODEJS_16_X,    // Execution environment
            code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
            handler: 'alternativeSpeciesFunction.handler',         // Code handler
            timeout: Duration.seconds(300),
            vpc: vpcStack.vpc,
            environment: {
                SM_DB_CREDENTIALS: db.secretPath,
                RDS_PROXY_ENDPOINT: db.rdsProxyEndpoint
              },
            functionName: "IntegLambAlternativeSpecies",
            memorySize: 512,
            layers: [postgres],
            role: lambdaRole
        });

        // Add the permission to the Lambda function's policy to allow API Gateway access
        IL_alternativeSpecies.addPermission('AllowApiGatewayInvoke', {
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/alternativeSpecies*`
        });
        
        // Change Logical ID to match the one decleared in YAML file of Open API
        const cfnLambda_alternativeSpecies  = IL_alternativeSpecies.node.defaultChild as lambda.CfnFunction;
        cfnLambda_alternativeSpecies.overrideLogicalId("IntegLambAlternativeSpecies");

        /**
         * 
         * Create Integration Lambda for Save List API Gateway endpoint
         */
        const IL_saveList = new lambda.Function(this, 'IntegLambSaveList', {
            runtime: lambda.Runtime.NODEJS_16_X,    // Execution environment
            code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
            handler: 'saveListFunction.handler',         // Code handler
            timeout: Duration.seconds(300),
            vpc: vpcStack.vpc,
            environment: {
                SM_DB_CREDENTIALS: db.secretPath,
                RDS_PROXY_ENDPOINT: db.rdsProxyEndpoint
              },
            functionName: "IntegLambSaveList",
            memorySize: 512,
            layers: [postgres],
            role: lambdaRole
        });

        // Add the permission to the Lambda function's policy to allow API Gateway access
        IL_saveList.addPermission('AllowApiGatewayInvoke', {
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/saveList*`
        });
        
        // Change Logical ID to match the one decleared in YAML file of Open API
        const cfnLambda_saveList  = IL_saveList.node.defaultChild as lambda.CfnFunction;
        cfnLambda_saveList.overrideLogicalId("IntegLambSaveList");

        /**
         * 
         * Create Integration Lambda for Images API Gateway endpoint
         */
        // Create a new role
        //Create a role for lambda to access the postgresql database
        const lambdaRoleWithS3 = new iam.Role(this, "lambdaRoleWithS3", {
          roleName: "lambdaRoleWithS3",
          assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        });

        // Grant access to EC2
        lambdaRoleWithS3.addToPolicy(
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              "ec2:CreateNetworkInterface",
              "ec2:DescribeNetworkInterfaces",
              "ec2:DeleteNetworkInterface",
              "ec2:AssignPrivateIpAddresses",
              "ec2:UnassignPrivateIpAddresses",
            ],
            resources: ["*"], // must be *
          })
        );

        // Grant access to Secret Manager
        lambdaRoleWithS3.addToPolicy(
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              //Secrets Manager
              "secretsmanager:GetSecretValue",
            ],
            resources: [
              `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
            ],
          })
        );

        // Grant access to log
        lambdaRoleWithS3.addToPolicy(
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              //Logs
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            resources: ["arn:aws:logs:*:*:*"],
          })
        );
        
        // Create a lambda function
        const IL_images = new lambda.Function(this, 'IntegLambImages', {
          runtime: lambda.Runtime.NODEJS_16_X,    // Execution environment
          code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
          handler: 'imagesFunction.handler',      // Code handler
          timeout: Duration.seconds(300),
          vpc: vpcStack.vpc,
          environment: {
            SM_DB_CREDENTIALS: db.secretPath,
            RDS_PROXY_ENDPOINT: db.rdsProxyEndpoint,
            BUCKET_NAME: functionalityStack.bucketName
          },
          functionName: "IntegLambImages",
          memorySize: 512,
          layers: [postgres],
          role: lambdaRoleWithS3
        });

        // Add the permission to the Lambda function's policy to allow API Gateway access
        IL_images.addPermission('AllowApiGatewayInvoke', {
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/plantsImages*`
        });

        // Add the policy to the Lambda function's policy to access S3 putObjectAcl
        IL_images.addToRolePolicy(iam.PolicyStatement.fromJson({
          Effect: "Allow",
          Action: [
            "s3:putObjectAcl", 
            "s3:PutObject", 
            "s3:GetObject",
            "s3:DeleteObject"
          ],
          Resource: `arn:aws:s3:::${functionalityStack.bucketName}/*`
        }));
        
        // Change Logical ID to match the one decleared in YAML file of Open API
        const cfnLambda_images = IL_images.node.defaultChild as lambda.CfnFunction;
        cfnLambda_images.overrideLogicalId("IntegLambImages");

        /**
         * 
         * Create Integration Lambda for getSignedURL API Gateway endpoint
         * TODO: To be deleted!!
         */
        const IL_getSignedURL = new lambda.Function(this, 'getSignedURL', {
          runtime: lambda.Runtime.NODEJS_16_X,    // Execution environment
          code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
          handler: 'getSignedURLFunction.handler',      // Code handler
          timeout: Duration.seconds(300),
          vpc: vpcStack.vpc,
          environment: {
            BUCKET_NAME: functionalityStack.bucketName
          },
          functionName: "getSignedURL",
          memorySize: 512
        });

        // Add the permission to the Lambda function's policy to allow API Gateway access
        IL_getSignedURL.addPermission('AllowApiGatewayInvoke', {
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/getS3SignedURL*`
        });

        // Add the policy to the Lambda function's policy to access S3 putObjectAcl
        IL_getSignedURL.addToRolePolicy(iam.PolicyStatement.fromJson({
          Effect: "Allow",
          Action: [
            "s3:putObjectAcl", 
            "s3:PutObject", 
            "s3:GetObject",
            "s3:DeleteObject"
          ],
          Resource: `arn:aws:s3:::${functionalityStack.bucketName}/*`
        }));

        // Add the policy to the Lambda function's policy to log data to CloudWatch
        IL_getSignedURL.addToRolePolicy(iam.PolicyStatement.fromJson({
          Effect: iam.Effect.ALLOW,
          Action: [
            //Logs
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          Resource: ["arn:aws:logs:*:*:*"],
        }));
        
        // Change Logical ID to match the one decleared in YAML file of Open API
        const cfnLambda_getSignedURL = IL_getSignedURL.node.defaultChild as lambda.CfnFunction;
        cfnLambda_getSignedURL.overrideLogicalId("getSignedURL");

        /**
         * 
         * Create Integration Lambda layer for aws-jwt-verify
         */ 
        const jwt = new lambda.LayerVersion(this, 'aws-jwt-verify', {
          code: lambda.Code.fromAsset('./lambda/layers/aws-jwt-verify.zip'),
          compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
          description: 'Contains the aws-jwt-verify library for JS',
        });

        /**
         * 
         * Create Lambda for Admin Authorization endpoints
         */
        const authorizationFunction= new lambda.Function(this, 'admin-authorization-api-gateway', {
          runtime: lambda.Runtime.NODEJS_16_X,    // Execution environment
          code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
          handler: 'adminAuthorizerFunction.handler',         // Code handler
          timeout: Duration.seconds(300),
          vpc: vpcStack.vpc,
          environment: {
            SM_COGNITO_CREDENTIALS: functionalityStack.secret.secretName
          },
          functionName: "adminLambdaAuthorizer",
          memorySize: 512,
          layers: [jwt],
          role: lambdaRole
        });

        // Add the permission to the Lambda function's policy to allow API Gateway access
        authorizationFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
        
        // Change Logical ID to match the one decleared in YAML file of Open API
        const apiGW_authorizationFunction = authorizationFunction.node.defaultChild as lambda.CfnFunction;
        apiGW_authorizationFunction.overrideLogicalId("adminLambdaAuthorizer");

        /**
         * 
         * Create Lambda for User Authorization endpoints
         */
        const authorizationFunction_user = new lambda.Function(this, 'user-authorization-api-gateway', {
          runtime: lambda.Runtime.NODEJS_16_X,    // Execution environment
          code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
          handler: 'userAuthorizerFunction.handler',         // Code handler
          timeout: Duration.seconds(300),
          vpc: vpcStack.vpc,
          environment: {
            SM_COGNITO_CREDENTIALS: functionalityStack.secret.secretName
          },
          functionName: "userLambdaAuthorizer",
          memorySize: 512,
          layers: [jwt],
          role: lambdaRole
        });

        // Add the permission to the Lambda function's policy to allow API Gateway access
        authorizationFunction_user.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
        
        // Change Logical ID to match the one decleared in YAML file of Open API
        const apiGW_authorizationFunction_user = authorizationFunction_user.node.defaultChild as lambda.CfnFunction;
        apiGW_authorizationFunction_user.overrideLogicalId("userLambdaAuthorizer");
    }
}
// Cogito is next
// https://medium.com/@michael.leigh.stewart/securing-an-api-with-aws-cdk-api-gateway-and-cognito-cee9158a2ddb
// https://www.youtube.com/watch?v=9crTLAT_4uY 

// RDS
// https://www.subaud.io/blog/build-a-private-rds-with-lambda-integration
// https://www.freecodecamp.org/news/aws-lambda-rds/
// https://github.com/schuettc/cdk-private-rds-with-lambda/blob/main/src/lambda.ts