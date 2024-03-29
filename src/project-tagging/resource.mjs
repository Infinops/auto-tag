import { ResourceGroupsTaggingAPIClient, GetResourcesCommand } from "@aws-sdk/client-resource-groups-tagging-api";





export async function fetchResourcesInRegion(region, projectTagName, projectTagEmptyValue) {
  let resultList = [];
  const clientConfig = {
    region,
    maxAttempts: 50,
  }
  const client = new ResourceGroupsTaggingAPIClient(clientConfig);
  let input = { // GetResourcesInput
    TagFilters: [ // TagFilterList
      { // TagFilter
        Key: projectTagName,
        Values: [ // TagValueList
          projectTagEmptyValue, ''
        ],
      },
    ],
    ResourcesPerPage: 100,
    ResourceTypeFilters: [ // ResourceTypeFilterList 

      "mq",
      "appstream",
      "cloudwatch",
      "events",
      "logs",
      "s3",
      "ec2",
      "dynamodb",
      "elasticmapreduce",
      "rds",
      "braket",
      "acm",
      "cloud9",
      "cloudtrail",
      "codeartifact",
      "codecommit",
      "codeguru-reviewer",
      "codepipeline",
      "cognito-identity",
      "comprehend",
      "config",
      "dms",
      "databrew",
      "dataexchange",
      "datapipeline",
      "elasticfilesystem",
      "eks",
      "emr-containers",
      "elasticache",
      "elasticbeanstalk",
      "docdb-elastic",
      "elastic-inference",
      "elasticloadbalancing",
      "es",
      "osis",
      "aoss",
      "fsx",
      "forecast",
      "pipes",
      "frauddetector",
      "glacier",
      "glue",
      "greengrass",
      "iot",
      "iotanalytics",
      "iotevents",
      "kms",
      "kinesis",
      "kinesisanalytics",
      "macie2",
      "lambda",
      "organizations",
      "qldb",
      "redshift",
      "redshift-serverless",
      "robomaker",
      "resource-groups",
      "ram",
      "ses",
      "sns",
      "route53resolver",
      "sqs",
      "sagemaker",
      "secretsmanager",
      "states",
      "storagegateway",
      "workspaces",
      "ssm"

    ],
    // IncludeComplianceDetails: true, // Maybe in future?
    // ExcludeCompliantResources: true, // Maybe in future?
  };
  let command = new GetResourcesCommand(input);
  let response = await client.send(command);
  try {
    resultList = response.ResourceTagMappingList;
    while (response.PaginationToken != null && response.PaginationToken != undefined && response.PaginationToken != '') {
      input.PaginationToken = response.PaginationToken;
      command = new GetResourcesCommand(input);
      response = await client.send(command);
      resultList = resultList.concat(response.ResourceTagMappingList);
    }
    console.log(region, resultList);
    return resultList;
  }
  catch (error) {
    console.log(region, error);
    return [];
  }
  // { // GetResourcesOutput
  //   PaginationToken: "STRING_VALUE",
  //   ResourceTagMappingList: [ // ResourceTagMappingList
  //     { // ResourceTagMapping
  //       ResourceARN: "STRING_VALUE",
  //       Tags: [ // TagList
  //         { // Tag
  //           Key: "STRING_VALUE", // required
  //           Value: "STRING_VALUE", // required
  //         },
  //       ],
  //       ComplianceDetails: { // ComplianceDetails
  //         NoncompliantKeys: [ // TagKeyList
  //           "STRING_VALUE",
  //         ],
  //         KeysWithNoncompliantValues: [
  //           "STRING_VALUE",
  //         ],
  //         ComplianceStatus: true || false,
  //       },
  //     },
  //   ],
  // };

}

