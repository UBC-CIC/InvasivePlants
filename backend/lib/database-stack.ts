import {Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';

// Service files import
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secretmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from "aws-cdk-lib/aws-logs";

// Stack import
import { VpcStack } from './vpc-stack';


export class DBStack extends Stack {
    public readonly dbInstance: rds.DatabaseInstance;
    public readonly secretPath: string;
    public readonly rdsProxyEndpoint: string; 
    constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: StackProps){
        super(scope, id, props);

        /**
         * 
         * Retrive a secrete from Secret Manager
         * aws secretsmanager create-secret --name InvasivePlantsSecrets --secret-string "{\"DB_Username\":\"DB-USERNAME\"}"  --profile <your-profile-name>
         */
        const secret = secretmanager.Secret.fromSecretNameV2(this, "ImportedSecrets", "InvasivePlantsSecrets");

        /**
         * 
         * Create an RDS with Postgres database in an isolated subnet
         */
        this.secretPath = "InvasivePlants/credentials/dbCredentials"; // Name in the Secret Manager to store DB credentials
        this.dbInstance = new rds.DatabaseInstance(this, "InvasivePlants", {
            vpc: vpcStack.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_14_5,
            }),
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            credentials: rds.Credentials.fromUsername(secret.secretValueFromJson("DB_Username").unsafeUnwrap(), {
                secretName: this.secretPath,
            }),
            multiAz: true,
            allocatedStorage: 100,
            maxAllocatedStorage: 115,
            allowMajorVersionUpgrade: false,
            autoMinorVersionUpgrade: true,
            backupRetention: Duration.days(7),
            deleteAutomatedBackups: true,
            deletionProtection: true,/// To be chanaged
            databaseName: "invasivePlants",
            publiclyAccessible: false,
            cloudwatchLogsRetention: logs.RetentionDays.INFINITE,
            storageEncrypted: true, // storage encryption at rest
            monitoringInterval: Duration.seconds(60), // enhanced monitoring interval
        });

        this.dbInstance.connections.securityGroups.forEach(function (securityGroup) {
            // 10.0.0.0/16 match the cidr range in vpc stack
            securityGroup.addIngressRule(
              ec2.Peer.ipv4("10.0.0.0/16"),
              ec2.Port.tcp(5432),
              "Postgres Ingress"
            );
        });
        
        /**
         * 
         * Create an RDS proxy that sit between lambda and RDS
         */
        const rdsProxy = new rds.DatabaseProxy(this, "invasivePlants-RDSProxy", {
            proxyTarget: rds.ProxyTarget.fromInstance(this.dbInstance),
            secrets: [this.dbInstance.secret!],
            vpc: vpcStack.vpc,
            securityGroups: this.dbInstance.connections.securityGroups,
            // securityGroups: [ec2.SecurityGroup.fromSecurityGroupId(this, 'VpcDefaultSecurityGroup', vpcStack.vpc.vpcDefaultSecurityGroup)],
            requireTLS: false,
        });
      
        const dbProxyRole = new iam.Role(this, "DBProxyRole", {
            assumedBy: new iam.AccountPrincipal(this.account),
        });
        rdsProxy.grantConnect(dbProxyRole, "admin"); // Grant the role connection access to the DB Proxy for database user 'admin'.
      
        this.rdsProxyEndpoint = rdsProxy.endpoint;
    }
}