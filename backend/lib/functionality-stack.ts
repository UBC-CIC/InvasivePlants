import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// AWS Services
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class FunctionalityStack extends cdk.Stack {
    public readonly secret: secretsmanager.ISecret;
    public readonly userpoolId: string;
    public readonly appClientId: string;
    public readonly region: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        /**
         * 
         * Create Cognito User Pool
         * Using verification code
         * Inspiration from http://buraktas.com/create-cognito-user-pool-aws-cdk/
         */
        const userpool = new cognito.UserPool(this, 'invasive-plants-pool', {
            userPoolName: 'invasive-plants-pool',
            signInAliases: {
                email: true,
            },
            selfSignUpEnabled: true,
            autoVerify: {
                email: true,
            },
            userVerification: {
                emailSubject: 'You need to verify your email',
                emailBody: 'Thanks for signing up to Invasive Plants App. \n Your verification code is {####}',
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
        const appClient = userpool.addClient('invasive-plants-pool', {
            userPoolClientName: 'invasive-plants-pool',
            authFlows: {
            userPassword: true,
            },
        });

        /**
         * 
         * Store secrets to Secret Manager
         * User pool id, client id, and region the user pool deployed
         */
        this.userpoolId = userpool.userPoolId;
        this.appClientId = appClient.userPoolClientId;
        this.region = this.region;

        const secretsName = "Invasive_Plants_Cognito_Secrets"
        this.secret = new secretsmanager.Secret(this, secretsName, {
            secretName: secretsName,
            description: "Cognito Secrets for authentication",
            secretObjectValue: {
                REACT_APP_USERPOOL_ID: cdk.SecretValue.unsafePlainText(this.userpoolId),
                REACT_APP_USERPOOL_WEB_CLIENT_ID: cdk.SecretValue.unsafePlainText(this.appClientId),
                REACT_APP_REGION: cdk.SecretValue.unsafePlainText(this.region)
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
    }
}
