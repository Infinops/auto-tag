#!/usr/bin/env ruby

require 'bundler/setup'
require 'cloudformation-ruby-dsl/cfntemplate'
require 'cloudformation-ruby-dsl/spotprice'
require 'cloudformation-ruby-dsl/table'

template do

  value AWSTemplateFormatVersion: '2010-09-09'

  value Description: 'Auto Tag (Open Source by Infinops)'

  parameter 'CodeS3Bucket',
            Description: 'The name of the code bucket in S3.',
            Type: 'String',
            Default: 'infinops-autotag-releases-ap-northeast-1'

  parameter 'CodeS3Path',
            Description: 'The path of the code zip file in the code bucket in S3.',
            Type: 'String',
            Default: 'autotag-0.1.1.zip'

  parameter 'CodeS3PathInitialTagging',
            Description: 'The path of the initial tagging code zip file in the code bucket in S3.',
            Type: 'String',
            Default: 'autotag-initial-0.1.1.zip'

  parameter 'CodeS3PathProjectTagging',
            Description: 'The path of the project tagging code zip file in the code bucket in S3.',
            Type: 'String',
            Default: 'autotag-project-0.1.1.zip'


  parameter 'LambdaName',
            Description: 'The name of the Lambda Function.',
            Type: 'String',
            AllowedValues: %w(InfinopsAutoTag InfinopsAutoTagDev),
            Default: 'InfinopsAutoTag'

  parameter 'AutoTagDebugLogging',
            Description: 'Enable/Disable Debug Logging for the Lambda Function for all processed CloudTrail events.',
            Type: 'String',
            AllowedValues: %w(Enabled Disabled),
            Default: 'Disabled'

  parameter 'AutoTagDebugLoggingOnFailure',
            Description: 'Enable/Disable Debug Logging when the Lambda Function has a failure.',
            Type: 'String',
            AllowedValues: %w(Enabled Disabled),
            Default: 'Enabled'

  parameter 'AutoTagTagsCreateTime',
            Description: 'Enable/Disable the "CreateTime" tagging for all resources.',
            Type: 'String',
            AllowedValues: %w(Enabled Disabled),
            Default: 'Enabled'

  parameter 'AutoTagTagsInvokedBy',
            Description: 'Enable/Disable the "InvokedBy" tagging for all resources.',
            Type: 'String',
            AllowedValues: %w(Enabled Disabled),
            Default: 'Enabled'

  parameter 'LogRetentionInDays',
            Description: 'Number of days to retain AutoTag logs.',
            Type: 'Number',
            Default: 90

  parameter 'CustomTags',
            Description: 'Define custom tags in a JSON document.',
            Type: 'String',
            Default: ''

  resource 'AutoTagLambdaFunction', Type: 'AWS::Lambda::Function', Properties: {
    Code: {
      S3Bucket: ref('CodeS3Bucket'),
      S3Key: ref('CodeS3Path'),
    },
    Description: 'Auto Tag (Open Source by Infinops)',
    FunctionName: sub('${LambdaName}'),
    Handler: sub('autotag_event.handler'),
    Role: get_att('AutoTagExecutionRole', 'Arn'),
    Runtime: 'nodejs18.x',
    # the ec2 instance worker will wait for up to 45 seconds for a
    # opsworks stack or autoscaling group to be tagged with the creator
    # in case the events come out of order
    Timeout: 120,
    Environment: {
      Variables: {
        DEBUG_LOGGING_ON_FAILURE: ref('AutoTagDebugLoggingOnFailure'),
        DEBUG_LOGGING:            ref('AutoTagDebugLogging'),
        CREATE_TIME:              ref('AutoTagTagsCreateTime'),
        INVOKED_BY:               ref('AutoTagTagsInvokedBy'),
        ROLE_NAME:                ref('AutoTagMasterRole'),
        CUSTOM_TAGS:              ref('CustomTags')
      }
    }
  }

  resource 'AutoTagInititialTaggingLambdaFunction', Type: 'AWS::Lambda::Function', Properties: {
    Code: {
      S3Bucket: ref('CodeS3Bucket'),
      S3Key: ref('CodeS3PathInitialTagging'),
    },
    Description: 'Infinops function for initial resource tagging (Open Source by Infinops)',
    FunctionName: sub('${LambdaName}InitialTagging'),
    Handler: sub('index.handler'),
    Role: get_att('AutoTagAdditionalExecutionRole', 'Arn'),
    Runtime: 'nodejs20.x',
    # the ec2 instance worker will wait for up to 45 seconds for a
    # opsworks stack or autoscaling group to be tagged with the creator
    # in case the events come out of order
    Timeout: 600
  }

  resource 'AutoTagProjectTaggingLambdaFunction', Type: 'AWS::Lambda::Function', Properties: {
    Code: {
      S3Bucket: ref('CodeS3Bucket'),
      S3Key: ref('CodeS3PathProjectTagging'),
    },
    Description: 'Infinops function for  resource tagging with project tag based on Name tag(Open Source by Infinops)',
    FunctionName: sub('${LambdaName}ProjectTagging'),
    Handler: sub('index.handler'),
    Role: get_att('AutoTagAdditionalExecutionRole', 'Arn'),
    Runtime: 'nodejs20.x',
    # the ec2 instance worker will wait for up to 45 seconds for a
    # opsworks stack or autoscaling group to be tagged with the creator
    # in case the events come out of order
    Timeout: 600
  }

  resource 'EventBridgeRuleEveryHour', Type: 'AWS::Events::Rule', Properties: {
    EventBusName: 'default',
    Name: 'infinops-cron-hour-rule',
    ScheduleExpression: 'rate(1 hour)',
    State: 'enabled',
    Targets: {
      Id: sub('${LambdaName}ProjectTagging'),
      Arn: sub("arn:aws:lambda:*:${AWS::AccountId}:function:${LambdaName}ProjectTagging"),
      Input: 'Matched event'
    }
} 


  resource 'InfinopsProjectNameTaggingTable', Type: 'AWS::DynamoDB::Table', Properties: {
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{
        AttributeName: "project",
        AttributeType: "S"
      }]
      KeySchema: [
        {
            AttributeName: "project",
            KeyType: "HASH"
        }
    ]
  } 

  resource 'AutoTagLogGroup', Type: 'AWS::Logs::LogGroup', Properties: {
      LogGroupName: sub('/aws/lambda/${AutoTagLambdaFunction}'),
      RetentionInDays: ref('LogRetentionInDays')
  }

  resource 'AutoTagLogsMetricFilterMaxMemoryUsed', Type: 'AWS::Logs::MetricFilter', DependsOn: %w[AutoTagLogGroup], Properties: {
      FilterPattern: '[report_name="REPORT", request_id_name="RequestId:", request_id_value, duration_name="Duration:", duration_value, duration_unit="ms", billed_duration_name_1="Billed", bill_duration_name_2="Duration:", billed_duration_value, billed_duration_unit="ms", memory_size_name_1="Memory", memory_size_name_2="Size:", memory_size_value, memory_size_unit="MB", max_memory_used_name_1="Max", max_memory_used_name_2="Memory", max_memory_used_name_3="Used:", max_memory_used_value, max_memory_used_unit="MB"]',
      LogGroupName: sub('/aws/lambda/${AutoTagLambdaFunction}'),
      MetricTransformations: [
          { MetricValue: '$max_memory_used_value',
            MetricNamespace: sub('PGi/${AutoTagLambdaFunction}'),
            MetricName: sub('${AutoTagLambdaFunction}-MemoryUsed')
          }]
  }

  resource 'AutoTagExecutionRole', Type: 'AWS::IAM::Role', Properties: {
    RoleName: sub('${AWS::StackName}Lambda'),
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Effect: 'Allow',
          Principal: {Service: ['lambda.amazonaws.com']},
          Action: ['sts:AssumeRole']
        }
      ]
    },
    Path: '/infinops/autotag/execution/'
  }


  resource 'AutoTagAdditionalExecutionRole', Type: 'AWS::IAM::Role', Properties: {
    RoleName: sub('${AWS::StackName}AdditionalLambda'),
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Effect: 'Allow',
          Principal: {Service: ['lambda.amazonaws.com']},
          Action: ['sts:AssumeRole']
        }
      ]
    },
    Path: '/infinops/autotag-add/execution/'
  }

  resource 'AutoTagAdditionalExecutionPolicy', Type: 'AWS::IAM::Policy', Properties: {
    PolicyName: sub('${AWS::StackName}AdditionalExecutionPolicy'),
    Roles: [ref('AutoTagAdditionalExecutionRole')],
    PolicyDocument: {
      Version: '2012-10-17',
      Statement:  [
            {
                Sid: "ResourceTagging",
                Effect: "Allow",
                Action: [
                    "tag:GetResources",
                    "tag:GetTagKeys",
                    "tag:GetTagValues",
                    "tag:GetComplianceSummary",
                    "tag:TagResources",
                    "opsworks:TagResource"
                ],
                Resource: [
                    "*"
                ]
            },
            {
                Sid: "GetRegionList",
                Effect: "Allow",
                Action: [
                    "ec2:DescribeRegions"
                ],
                Resource: [
                    "*"
                ]
            },
            {
                Sid: "Tagging",
                Effect: "Allow",
                Action: [
                    "mq:CreateTags",
                    "appstream:TagResource",
                    "cloudwatch:TagResource",
                    "events:TagResource",
                    "logs:TagResource",
                    "s3:PutBucketTagging",
                    "ec2:CreateTags",
                    "dynamodb:TagResource",
                    "elasticmapreduce:AddTags",
                    "rds:AddTagsToResource",
                    "braket:TagResource",
                    "acm:AddTagsToCertificate",
                    "cloud9:TagResource",
                    "cloudformation:TagResource",
                    "cloudformation:DescribeStacks",
                    "cloudtrail:AddTags",
                    "codeartifact:TagResource",
                    "codecommit:TagResource",
                    "codeguru-reviewer:TagResource",
                    "codepipeline:TagResource",
                    "cognito-identity:TagResource",
                    "comprehend:TagResource",
                    "config:TagResource",
                    "dms:AddTagsToResource",
                    "databrew:TagResource",
                    "dataexchange:TagResource",
                    "datapipeline:AddTags",
                    "elasticfilesystem:TagResource",
                    "elasticfilesystem:CreateTags",
                    "eks:TagResource",
                    "emr-containers:TagResource",
                    "elasticache:AddTagsToResource",
                    "elasticbeanstalk:AddTags",
                    "elasticbeanstalk:UpdateTagsForResource",
                    "docdb-elastic:TagResource",
                    "elastic-inference:TagResource",
                    "elasticloadbalancing:AddTags",
                    "es:AddTags",
                    "osis:TagResource",
                    "aoss:TagResource",
                    "fsx:TagResource",
                    "forecast:TagResource",
                    "pipes:TagResource",
                    "frauddetector:TagResource",
                    "glacier:AddTagsToVault",
                    "glue:TagResource",
                    "greengrass:TagResource",
                    "iot:TagResource",
                    "iotanalytics:TagResource",
                    "iotevents:TagResource",
                    "kms:TagResource",
                    "kinesis:AddTagsToStream",
                    "kinesisanalytics:TagResource",
                    "macie2:TagResource",
                    "lambda:TagResource",
                    "organizations:TagResource",
                    "qldb:TagResource",
                    "redshift:CreateTags",
                    "redshift-serverless:TagResource",
                    "robomaker:TagResource",
                    "resource-groups:Tag",
                    "ram:TagResource",
                    "ses:TagResource",
                    "sns:TagResource",
                    "route53resolver:TagResource",
                    "sqs:TagQueue",
                    "sagemaker:AddTags",
                    "secretsmanager:TagResource",
                    "states:TagResource",
                    "storagegateway:AddTagsToResource",
                    "workspaces:CreateTags",
                    "ssm:AddTagsToResource"
                ],
                Resource: [
                    "*"
                ]
            }
          ]
    }
  }

  resource 'AutoTagDynamoDbProjectList', Type: 'AWS::IAM::Policy', Properties: {
    PolicyName: sub('${AWS::StackName}DynamoDbProjectList'),
    Roles: [ref('AutoTagAdditionalExecutionRole')],
    PolicyDocument: {
      Version: '2012-10-17',
      Statement:  [
        {
          Sid: "DynamoDB",
          Effect: "Allow",
          Action: [
              "dynamodb:BatchGetItem",
              "dynamodb:GetItem",
              "dynamodb:Scan"
          ],
          Resource: [sun("arn:aws:dynamodb:*:${AWS::AccountId}:table/InfinopsProjectNameTaggingTable")]
      }]
    }
  }

  resource 'AutoTagExecutionPolicy', Type: 'AWS::IAM::Policy', Properties: {
    PolicyName: sub('${AWS::StackName}ExecutionPolicy'),
    Roles: [ref('AutoTagExecutionRole')],
    PolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: %w[logs:CreateLogGroup logs:CreateLogStream logs:PutLogEvents],
          Resource: 'arn:aws:logs:*:*:*'
        },
        {
          Effect: 'Allow',
          Action: ['sts:*'],
          Resource: [ sub('arn:aws:iam::*:role/infinops/autotag/master/${AWS::StackName}') ]
        }
      ]
    }
  }

  resource 'AutoTagMasterRole', Type: 'AWS::IAM::Role', Properties: {
    RoleName: sub('${AWS::StackName}'),
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Effect: 'Allow',
          Principal: {AWS: get_att('AutoTagExecutionRole', 'Arn')},
          Action: ['sts:AssumeRole'],
        }
      ]
    },
    Path: '/infinops/autotag/master/',
  }

  resource 'AutoTagMasterPolicy', Type: 'AWS::IAM::Policy', Properties: {
    PolicyName: sub('${AWS::StackName}MasterPolicy'),
    Roles: [ref('AutoTagMasterRole')],
    PolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: %w[
            autoscaling:CreateOrUpdateTags
            autoscaling:DescribeAutoScalingGroups
            autoscaling:DescribeAutoScalingInstances
            autoscaling:DescribeTags
            cloudwatch:TagResource
            datapipeline:AddTags
            dynamodb:ListTagsOfResource
            dynamodb:TagResource
            ec2:CreateTags
            ec2:DescribeInstances
            ec2:DescribeSnapshots
            events:TagResource
            elasticloadbalancing:AddTags
            elasticmapreduce:AddTags
            iam:TagRole
            iam:TagUser
            lambda:TagResource
            logs:TagLogGroup
            opsworks:DescribeInstances
            opsworks:DescribeStacks
            opsworks:ListTags
            opsworks:TagResource
            rds:AddTagsToResource
            s3:GetBucketTagging
            s3:PutBucketTagging
          ],
          Resource: ['*']
        }
      ]
    }
  }

  # all regions that exist according to the SDK
  Aws.partition('aws').regions.each do |region|
    region_description = region.description.sub(/.*\((.*)\)/, '\1').gsub(/[\.\s]+/, '')

    resource "TriggerLambdaPermRegion#{region_description}",
             Type: 'AWS::Lambda::Permission',
             DependsOn: 'AutoTagLambdaFunction',
             Properties: {
               Action: 'lambda:InvokeFunction',
               FunctionName: get_att('AutoTagLambdaFunction', 'Arn'),
               Principal: 'sns.amazonaws.com',
               SourceArn: sub("arn:aws:sns:#{region.name}:${AWS::AccountId}:AutoTag")
             }
  end

end.exec!
