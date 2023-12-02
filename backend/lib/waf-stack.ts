import { Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

export class WAFStack extends Stack {
    public readonly WAFwebACL: wafv2.CfnWebACL;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create WAFvs As web ACL using AWSManagedRulesCommonRuleSet
        // Adapted from https://aws.amazon.com/blogs/devops/easily-protect-your-aws-cdk-defined-infrastructure-with-aws-wafv2/
        // Limitation as to why only use 'us-east-1': https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_wafv2.CfnWebACL.html
        this.WAFwebACL = new wafv2.CfnWebACL(this, 'InvasivePlants-Cloudfront-WebACL', {
            defaultAction: {
                allow: {}
            },
            scope: 'CLOUDFRONT',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName:'MetricForWebACLCDK',
                sampledRequestsEnabled: true,
            },
            name: 'InvasivePlants-Cloudfront-WebACL',
            description: 'This WAF-WebACL run on default rule: AWSManagedRulesAmazonIpReputationList, AWSManagedRulesCommonRuleSet, and AWSManagedRulesKnownBadInputsRuleSet.',
            rules: [
                {
                    name: 'AWS-AWSManagedRulesAmazonIpReputationList',
                    priority: 0,
                    statement: {
                        managedRuleGroupStatement: {
                        name:'AWSManagedRulesAmazonIpReputationList',
                        vendorName:'AWS'
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        sampledRequestsEnabled: true,
                        metricName:'AWS-AWSManagedRulesAmazonIpReputationList',
                    },
                    overrideAction: {
                        none: {}
                    },
                },
                {
                    name: 'AWS-AWSManagedRulesCommonRuleSet',
                    priority: 1,
                    statement: {
                        managedRuleGroupStatement: {
                        name:'AWSManagedRulesCommonRuleSet',
                        vendorName:'AWS'
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        sampledRequestsEnabled: true,
                        metricName:'AWS-AWSManagedRulesCommonRuleSet',
                    },
                    overrideAction: {
                        none: {}
                    },
                },
                {
                    name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
                    priority: 2,
                    statement: {
                        managedRuleGroupStatement: {
                        name:'AWSManagedRulesKnownBadInputsRuleSet',
                        vendorName:'AWS'
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        sampledRequestsEnabled: true,
                        metricName:'AWS-AWSManagedRulesKnownBadInputsRuleSet',
                    },
                    overrideAction: {
                        none: {}
                    },
                },
            ]
        });
    }
}
