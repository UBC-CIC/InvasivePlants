import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// AWS Services
import * as s3 from 'aws-cdk-lib/aws-s3';

export class SampleStack extends cdk.Stack {
    public readonly bucketName: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        /**
         * 
         * Create S3 buckets for plants data
         */
        
        const s3bucket = new s3.Bucket(this, 'invasive-plants-bucket', {
            bucketName: "invasive-plants-bucket",
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            cors: [{
                allowedHeaders: ['*'],
                allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD],
                allowedOrigins: ['*'],
            }]
        });

        this.bucketName = s3bucket.bucketName;
    }
}
