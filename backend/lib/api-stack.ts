import {Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Fn } from 'aws-cdk-lib';

// Service files import
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class APIStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps){
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
            deploy: true
        });

        // Source Code: https://stackoverflow.com/questions/62179893/aws-cdk-how-to-create-an-api-gateway-backed-by-lambda-from-openapi-spec
        // https://medium.com/@gwieser/solving-a-nightmare-aws-cdk-openapi-and-api-gateway-a1b6fdc1fd24 

        /**
         * 
         * Create Integration Lambda for Region API Gateway endpoint
         */
        const IL_Region = new lambda.Function(this, 'IntegLambRegion', {
            runtime: lambda.Runtime.NODEJS_18_X,    // Execution environment
            code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
            handler: 'regionFunction.handler',         // Code handler

            functionName: "IntegLambRegion",
            memorySize: 128,
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
            runtime: lambda.Runtime.NODEJS_18_X,    // Execution environment
            code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
            handler: 'invasiveSpeciesFunction.handler',         // Code handler

            functionName: "IntegLambInvasiveSpecies",
            memorySize: 128,
        });

        // Add the permission to the Lambda function's policy to allow API Gateway access
        IL_InvasiveSpecies.addPermission('AllowApiGatewayInvoke', {
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/invasiveSpecies*`
        });
        
        // Change Logical ID to match the one decleared in YAML file of Open API
        const cfnLambda_invasiveSpecies = IL_InvasiveSpecies.node.defaultChild as lambda.CfnFunction;
        cfnLambda_invasiveSpecies.overrideLogicalId("IntegLambInvasiveSpecies");

        /**
         * 
         * Create Integration Lambda for Alternative Species API Gateway endpoint
         */
        const IL_alternativeSpecies = new lambda.Function(this, 'IntegLambAlternativeSpecies', {
            runtime: lambda.Runtime.NODEJS_18_X,    // Execution environment
            code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
            handler: 'alternativeSpeciesFunction.handler',         // Code handler

            functionName: "IntegLambAlternativeSpecies",
            memorySize: 128,
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
            runtime: lambda.Runtime.NODEJS_18_X,    // Execution environment
            code: lambda.Code.fromAsset('lambda'),  // Code loaded from "lambda" directory
            handler: 'saveListFunction.handler',    // Code handler

            functionName: "IntegLambSaveList",
            memorySize: 128,
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
        











        // const api = new apigateway.RestApi(this, 'APIGateway', {
        //     restApiName: "ParkinsonsAPI",
        //     endpointTypes: [apigateway.EndpointType.REGIONAL],
        //     deployOptions: {
        //         metricsEnabled: true,
        //         loggingLevel: apigateway.MethodLoggingLevel.INFO,
        //         dataTraceEnabled: true,
        //         stageName: 'prod',
        //         methodOptions: {
        //         "/*/*": {
        //             throttlingRateLimit: 100,
        //             throttlingBurstLimit: 200
        //         }
        //         }
        //     },
        // });
        // const books = api.root.addResource('books');
        // books.addMethod('GET', new apigateway.LambdaIntegration(integrationLambda));
        
    }
}
// Cogito is next
// https://medium.com/@michael.leigh.stewart/securing-an-api-with-aws-cdk-api-gateway-and-cognito-cee9158a2ddb