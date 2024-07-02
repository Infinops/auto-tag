# Auto Tag

[![Software License](https://img.shields.io/github/license/gorillastack/auto-tag.svg?style=for-the-badge)](/LICENSE.md)

This is an open-source tagging solution for AWS. Deploy Infinops AutoTag to Lambda using CloudTrail consumed through CloudWatch Events and have each of your resources tagged with the ARN of who created it. Optionally, resources can be tagged with when it was created and which AWS service invoked the request if one is provided.


## About

Automatically tagging resources can greatly improve the ease of cost allocation and governance.

CloudWatch events delivers a near real-time stream of CloudTrail events as soon as a [supported resource type](#supported-resource-types) is created. CloudWatch event rules triggers our AutoTag code to tag the resource. In this configuration the Lambda function is executed once each time it is triggered by the CloudWatch Event Rule (one event at a time). The CloudWatch Event Rule includes a pattern filter so it is only triggered by the supported events, meaning fewer Lambda invocations and lower operational costs.

## Installation

The infrastructure consists of:

* S3 Bucket
* Main CloudFormation Stack (1 AWS region)
  * Lambda Function
  * IAM Role
* Collector CloudFormation Stack (All active AWS regions)
  * CloudWatch Events Rule
  * SNS Topic

## Custom Tags

Add pre-defined static tagging or custom tagging from the CloudTrail event. Using a JSON document, define one or more tags with either a hard-coded value or a value extracted from the CloudTrail event using variable substitution. Hard-coded tags will be applied to all [supported AWS resources](#supported-resource-types). When using variable substitution more than one variable can be provided in a single tag value, and if all of the substitutions in the field fail to be resolved the tag will not be written. That will allow for custom tags to be created using certain CloudTrail event fields that may not exist in all CloudTrail event types. Check out the [CloudTrail Log Event Reference](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference.html) for the most common fields. Also, each AWS resource will have unique fields in the `requestParameters` and `responseElements` fields that can be used. Examples of specific AWS resource CloudTrail events can be found at [CloudTrail Log File Examples](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-examples.html) or by searching in the CloudTrail event history.

Example:

```json
{
  "AutoTag_ManagedBy": "Site Reliability Engineering",
  "AutoTag_UserIdentityType": "$event.userIdentity.type",
  "AutoTag_UserName": "$event.userIdentity.userName",
  "AutoTag_ClientInfo": "SourceIP: $event.sourceIPAddress - UserAgent: $event.userAgent",
  "AutoTag_Ec2_ImageId": "$event.responseElements.instancesSet.items.0.imageId"
}
```

## Prerequisites

You will need at least 1 AWS Account, and CloudTrail should be enabled.

## Deployment Methods

We have documented two different ways to deploy the infrastructure to an AWS account. Since there are CloudFormation stacks that need to be deployed in multiple regions we've provided a script that uses the AWS CLI to deploy everything for you. The other deployment method uses CloudFormation StackSets to deploy across multiple regions.

### Script Deployment Method 1: Deploy through our script

This deploy script `deploy_autotag.sh` will create, delete, or update all of the AutoTag infrastructure for a single AWS account.

The script will attempt to auto-install its own dependencies: `aws-cli`, `jq`, `npm`, `git`, `zip`

The `create` command will start by creating a dedicated AutoTag S3 Bucket for storing code deployment packages in your AWS account. Then it will download or build the code package, and create both the main CloudFormation stack and the collector CloudFormation stacks. When executing the `delete` command all resources will be removed except the S3 bucket. Use the `update-local` to update to the local cloned git repo (build required).

#### Credentials

The deploy script can use all of the credential providers that the AWS CLI allows, see [Configure AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) and take a look at the [deployment examples](#deployment-examples). A separate set of CLI credentials can be provided by the argument `--s3-profile` for utilizing a single S3 bucket when deploying infrastructure across multiple AWS accounts. The script will also secure the S3 bucket by blocking all public access configuration, and add the required S3 bucket-policy statement to allow the cross-account `GetObject` access if necessary. 

#### IAM Policy Permissions

The script needs at minimum the IAM permissions described in this policy: [deploy\_iam\_policy.json](deploy_iam_policy.json)

Before running the script: 

1. create an S3 bucket where you will store Auto Tag data.
2. copy the contents of deploy_iam_policy.json to a new text document.
3. in the copied content, replace the 2 occurrences of `my-autotag-bucket` with the name of bucket from step 1.
4. add the policy from your text document to the IAM user that will be used by the deployment script.

#### Commands and Options

```text
Usage: deploy_autotag.sh [options] <command>

Commands:
    create                    Create the Infinops AutoTag infrastructure
    delete                    Delete the Infinops AutoTag infrastructure
    update-local              Update the Infinops AutoTag infrastructure with the local source code

Options:
    -h   --help                  Show this screen
    -r   --region                The primary AWS region where the main CloudFormation stack will be deployed
    -p   --profile               The main AWS credential profile
    -s3bu --s3-bucket            The S3 bucket where the code package will be uploaded
    -s3pr --s3-profile           A separate AWS credential profile to upload code packages to the S3 Bucket
    -rv   --release-version      The release version to deploy, e.g. '0.5.2' or 'latest'
    
    -lr   --log-retention-days   The number of days to retain the Lambda Function's logs (default: 90)
    -ld   --log-level-debug      Enable the debug logging for the Lambda Function
    -dct  --disable-create-time  Disable the 'CreateTime' tagging for all AWS resources
    -dib  --disable-invoked-by   Disable the 'InvokedBy' tagging for all AWS resources
    -ct   --custom-tags          Define custom tags in a JSON document
```

#### Preparation

Follow these steps to prepare to run the `create` command.

1. Select a primary AWS `--region` for the S3 bucket and the Main CloudFormation stack
2. Pick a dedicated AutoTag `--s3-bucket` name, e.g. 'acme-autotag'
3. Configure AWS credentials for the AWS CLI, see [Configure AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)

#### Setup

```
sudo apt update 
sudo apt install awscli -y
aws configure
```

#### Deployment Examples
Firstly
Download the latest version of `deploy_autotag.sh`, or find it in the root of the repository.
Create the infrastructure to the local git folder's current state.

```
git clone https://github.com/Infinops/auto-tag.git
cd auto-tag
git checkout infinops-main
npm i
chmod +x deploy_autotag.sh
./deploy_autotag.sh --region us-west-2 --s3-bucket auto-tag2 --release-version local create
```

### Script Deployment Method 2: Deploy using CloudFormation StackSets

[CloudFormation StackSet Deployment Method](STACKSET.md)

## Supported Resource Types

Currently Infinops Auto-Tag, supports the following AWS resource types:

__Tags Applied__: C=Creator, T=Create Time, I=Invoked By

|Technology                 |Event Name            |Tags Applied|IAM Deny Tag Support
|---------------------------|----------------------|------------|---
|AutoScaling Group          |CreateAutoScalingGroup|C, T, I     |Yes
|ASG Instances w/ENI & Vol  |RunInstances          |C, T, I     |Yes
|Data Pipeline              |CreatePipeline        |C, T, I     |No
|DynamoDB Table             |CreateTable           |C, T, I     |No
|CloudWatch Alarm ?         |PutMetricAlarm        |C, T, I     |?
|CloudWatch Events Rule ?   |PutRule               |C, T, I     |?
|CloudWatch Log Group ?     |CreateLogGroup        |C, T, I     |?
|EBS Volume                 |CreateVolume          |C, T, I     |Yes
|EC2 AMI w/Snapshot \*      |CreateImage           |C, T, I     |Yes
|EC2 AMI w/Snapshot \*      |CopyImage             |C, T, I     |Yes
|EC2 AMI \*                 |RegisterImage         |C, T, I     |Yes
|EC2 Customer Gateway ?     |CreateCustomerGateway |C, T, I     |?
|EC2 DHCP Options ?         |CreateDhcpOptions     |C, T, I     |?
|EC2 Elastic IP             |AllocateAddress       |C, T, I     |Yes
|EC2 ENI                    |CreateNetworkInterface|C, T, I     |Yes
|EC2 Instance w/ENI & Volume|RunInstances          |C, T, I     |Yes
|EC2 / VPC Security Group   |CreateSecurityGroup   |C, T, I     |Yes
|EC2 Snapshot \*            |CreateSnapshot        |C, T, I     |Yes
|EC2 Snapshot \*            |CopySnapshot          |C, T, I     |Yes
|EC2 Snapshot \*            |ImportSnapshot        |C, T, I     |Yes
|Elastic LB (v1 & v2)       |CreateLoadBalancer    |C, T, I     |No
|EMR Cluster                |RunJobFlow            |C, T, I     |No
|IAM Role                   |CreateRole            |C, T, I     |?
|IAM User                   |CreateUser            |C, T, I     |?
|Lambda Function ?          |CreateFunction20150331|C, T, I     |?
|Lambda Function ?          |CreateFunction20141111|C, T, I     |?
|OpsWorks Stack             |CreateStack           |C           |No
|OpsWorks Clone Stack *     |CloneStack            |C           |No
|OpsWorks Instances w/ENI & Vol|RunInstances       |C, T, I     |Yes
|RDS Instance               |CreateDBInstance      |C, T, I     |No
|S3 Bucket                  |CreateBucket          |C, T, I     |No
|NAT Gateway                |CreateNatGateway      |C, T, I     |Yes
|VPC                        |CreateVpc             |C, T, I     |Yes
|VPC Internet Gateway       |CreateInternetGateway |C, T, I     |Yes
|VPC Network ACL            |CreateNetworkAcl      |C, T, I     |Yes
|VPC Peering Connection     |CreateVpcPeeringConnection|C, T, I |Yes
|VPC Route Table            |CreateRouteTable      |C, T, I     |Yes
|VPC Subnet                 |CreateSubnet          |C, T, I     |Yes
|VPN Connection             |CreateVpnConnection   |C, T, I     |Yes
|VPN Gateway ?              |CreateVpnGateway      |C, T, I     |?

_*=not tested by the test suite_

NOTE: When tag-able resources are created using CloudFormation __StackSets__ the "Creator" tag is NEVER populated with the ARN of the user who executed the StackSet, instead it is tagged with the less useful CloudFormation StackSet Execution Role's "assumed-role" ARN. 

## Deny Create/Delete/Edit for AutoTags

Use the following IAM policy to deny a user or role the ability to create, delete, and edit any tag starting with 'AutoTag\_'. The `ec2:CreateAction` condition allows users to create EC2 instances with tags starting with 'AutoTag_', this enables the 'Launch More Like This' feature, in that case the tags will be overwritten after the instance is created.

```json
{
    "Sid": "DenyAutoTagPrefix",
    "Effect": "Deny",
    "Action": [
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "autoscaling:CreateOrUpdateTags",
        "autoscaling:DeleteTags"
    ],
    "Condition": {
        "ForAnyValue:StringLike": {
            "aws:TagKeys": "AutoTag_*"
        },
        "StringNotEquals": {
            "ec2:CreateAction": [
                "RunInstances"
            ]
        }
    },
    "Resource": "*"
}
```

NOTE: At the time of this writing the deny tag IAM condition (aws:TagKeys) is only available for resources in EC2 and AutoScaling, see the table above for a status of each resource.

### Updating the infrastructure
Update the infrastructure to the local git folder's current state.

```bash
git clone https://github.com/Infinops/auto-tag.git
cd auto-tag
./deploy_autotag.sh -r us-west-2 -s3bu my-autotag-bucket update-local
```

### Delete the infrastructure
Delete the infrastructure.

```bash
./deploy_autotag.sh -r us-west-2 delete
```

### FAQ

```Where is the current Infinops AutoTag code ?
https://github.com/Infinops/auto-tag.git```

```How are resources automatically tagged ?```

```The InfinopsAutoTag lambda function is responsible for automatic resource tagging. After a new resource is created, a trigger is run, which calls and passes all the necessary information to the lambda and tags the resource.```
