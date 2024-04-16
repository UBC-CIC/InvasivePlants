import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

// AWS Services
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as SSM from "aws-cdk-lib/aws-ssm";
import * as iam from "aws-cdk-lib/aws-iam";

export class FunctionalityStack extends cdk.Stack {
  public readonly secret: secretsmanager.ISecret;
  public readonly bucketName: string;
  public readonly appClient: cognito.UserPoolClient;
  public readonly userpool: cognito.UserPool;
  public readonly identityPool: cognito.CfnIdentityPool;

  public readonly s3_Object_baseURL: string;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     *
     * Create Cognito User Pool
     * Using verification code
     * Inspiration from http://buraktas.com/create-cognito-user-pool-aws-cdk/
     */
    const userPoolName = "invasivePlantsUserPool";

    this.userpool = new cognito.UserPool(this, "invasive-plants-pool", {
      userPoolName: userPoolName,
      signInAliases: {
        email: true,
      },
      selfSignUpEnabled: false,
      autoVerify: {
        email: true,
      },
      userVerification: {
        emailSubject: "You need to verify your email",
        emailBody:
          "Thanks for signing up to Invasive Plants App. \n Your verification code is {####}",
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /**
     *
     * Create Cognito Client
     * An entity that allows your application to interact with the AWS Cognito User Pool service
     */
    this.appClient = this.userpool.addClient("invasive-plants-pool", {
      userPoolClientName: userPoolName,
      authFlows: {
        userPassword: true,
      },
    });

    /**
     *
     * Create user group for admin
     */
    const cfnUserPoolGroup = new cognito.CfnUserPoolGroup(
      this,
      "cognito-userGroup",
      {
        userPoolId: this.userpool.userPoolId,

        // the properties below are optional
        description: "Admin usergroup to perform data manipulation",
        groupName: "ADMIN_USER",
        precedence: 1,
      }
    );

    /**
     * Create Cognito Identity Pool
     * An identity pool is a store of user identity information that is specific to your AWS account
     */
    this.identityPool = new cognito.CfnIdentityPool(
      this,
      "invasive-plants-identity-pool",
      {
        allowUnauthenticatedIdentities: true, // Set to true to allow unauthenticated (guest) users (mobile app)
        identityPoolName: "invasivePlantsIdentityPool",
        cognitoIdentityProviders: [
          {
            clientId: this.appClient.userPoolClientId,
            providerName: this.userpool.userPoolProviderName,
          },
        ],
      }
    );


    /**
     *
     * Store secrets to Secret Manager
     * User pool id, client id, and region the user pool deployed
     */
    const secretsName = "Invasive_Plants_Cognito_Secrets"; //"Invasive_Plants_Setup_Secrets";

    this.secret = new secretsmanager.Secret(this, secretsName, {
      secretName: secretsName,
      description: "Cognito Secrets for authentication",
      secretObjectValue: {
        REACT_APP_USERPOOL_ID: cdk.SecretValue.unsafePlainText(
          this.userpool.userPoolId
        ),
        REACT_APP_USERPOOL_WEB_CLIENT_ID: cdk.SecretValue.unsafePlainText(
          this.appClient.userPoolClientId
        ),
        REACT_APP_REGION: cdk.SecretValue.unsafePlainText(this.region),
        REACT_APP_IDENTITY_POOL_ID: cdk.SecretValue.unsafePlainText(this.identityPool.ref),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /**
     *
     * Create S3 buckets for plants data
     */
    const s3bucket = new s3.Bucket(this, "invasive-plants-bucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ["*"],
        },
      ],
    });

    // Attach a bucket policy for access logs
    s3bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(
            "logdelivery.elasticloadbalancing.amazonaws.com"
          ),
        ],
        actions: ["s3:PutObject"],
        resources: [`${s3bucket.bucketArn}/AWSLogs/${cdk.Aws.ACCOUNT_ID}/*`],
      })
    );

    this.bucketName = s3bucket.bucketName;

    /**
     *
     * Create a CloudFront distribution as CDN for plants images.
     *  - Origin: S3 buckets
     *  - Cached Optimized
     */
    const CFDistribution = new cloudfront.Distribution(
      this,
      "CloudFront-Distribution",
      {
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.S3Origin(s3bucket),
        },
        comment: "CloudFront distribution for S3 as origin",
      }
    );

    this.s3_Object_baseURL = CFDistribution.distributionDomainName;
  }
}
