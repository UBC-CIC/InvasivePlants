import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

// AWS Services
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";

export class FunctionalityStack extends cdk.Stack {
  public readonly secret: secretsmanager.ISecret;
  public readonly bucketName: string;
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
    const userpool = new cognito.UserPool(this, "invasive-plants-pool", {
      userPoolName: userPoolName,
      signInAliases: {
        email: true,
      },
      selfSignUpEnabled: true,
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
    const appClient = userpool.addClient("invasive-plants-pool", {
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
        userPoolId: userpool.userPoolId,

        // the properties below are optional
        description: "Admin usergroup to perform data manipulation",
        groupName: "ADMIN_USER",
        precedence: 1,
      }
    );

    /**
     *
     * Create a random API key that will be use when creating an API key
     */
    function generateRandomString(length: number): string {
      var result = "";
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    }

    /**
     *
     * Store secrets to Secret Manager
     * User pool id, client id, and region the user pool deployed
     */
    const secretsName = "Invasive_Plants_Cognito_Secrets"; //"Invasive_Plants_Setup_Secrets";

    // Read parameter from user
    const apiKey = new cdk.CfnParameter(this, "apiKey", {
      type: "String",
      description: "Custome apiKey for the API Gateway.",
      default: generateRandomString(32),
    });

    // Check if the user provided an API key
    if (apiKey.value) {
      this.secret = new secretsmanager.Secret(this, secretsName, {
        secretName: secretsName,
        description: "Cognito Secrets for authentication",
        secretObjectValue: {
          REACT_APP_USERPOOL_ID: cdk.SecretValue.unsafePlainText(
            userpool.userPoolId
          ),
          REACT_APP_USERPOOL_WEB_CLIENT_ID: cdk.SecretValue.unsafePlainText(
            appClient.userPoolClientId
          ),
          REACT_APP_REGION: cdk.SecretValue.unsafePlainText(this.region),
          REACT_APP_X_API_KEY: cdk.SecretValue.unsafePlainText(
            apiKey.valueAsString
          ),
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    } else {
      // User did not provide an API key, generate a random one
      this.secret = new secretsmanager.Secret(this, secretsName, {
        secretName: secretsName,
        description: "Cognito Secrets for authentication",
        secretObjectValue: {
          REACT_APP_USERPOOL_ID: cdk.SecretValue.unsafePlainText(
            userpool.userPoolId
          ),
          REACT_APP_USERPOOL_WEB_CLIENT_ID: cdk.SecretValue.unsafePlainText(
            appClient.userPoolClientId
          ),
          REACT_APP_REGION: cdk.SecretValue.unsafePlainText(this.region),
          REACT_APP_X_API_KEY: cdk.SecretValue.unsafePlainText(
            generateRandomString(32)
          ),
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

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
