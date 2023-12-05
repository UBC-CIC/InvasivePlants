import { RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends Stack {
    public readonly repo: ecr.Repository;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create an ECR repository
        // During login make sure to specify the profile
        // aws ecr get-login-password --region ca-central-1 --profile <Your-Profile>| docker login
        this.repo = new ecr.Repository(this, `repository`, {
            repositoryName: `invasive-plants-repo`,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteImages: true,
        });
        
    }
}