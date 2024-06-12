# Running the Lambda Function for Project Tagging of Resources

This guide describes the process of running the Lambda function responsible for assigning the `project` tag to resources. The Lambda function is created automatically during the execution of the deployment script available at [deploy_autotag.sh](https://github.com/Infinops/auto-tag/blob/infinops-main/deploy_autotag.sh).

## Steps to Set Up and Run the Project Tagging Lambda

### 1. Configure DynamoDB

First, you need to configure DynamoDB to include your project names. Follow these steps:

1. **Open the DynamoDB Console**:
   - Navigate to the DynamoDB console in the region where the deployment was executed: [DynamoDB Console (us-west-2)](https://us-west-2.console.aws.amazon.com/dynamodbv2/home?region=us-west-2#tables).

2. **Locate the DynamoDB Table**:
   - Find the table that starts with `InfinopsAutoTag-InfinopsProjectNameTaggingTable`.

3. **Add Project Names**:
   - Add the project names that exist in your AWS account to the table using key-value pairs in the format `project:infinops`.

### 2. Understanding the Lambda Function

The Lambda function `InfinopsAutoTagProjectTagging` will analyze the project names added to DynamoDB, check the resource names, and assign the `project` tag accordingly.

### 3. Automatic Execution

The `InfinopsAutoTagProjectTagging` Lambda function is designed to run automatically every hour. This ensures that the resources are regularly tagged with the appropriate project names.

### 4. Manual Execution

If you wish to run the Lambda function manually, follow these steps:

1. **Open the AWS Lambda Console**:
   - Navigate to the AWS Lambda console in the region where the deployment was executed: [AWS Lambda Console (us-west-2)](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions).

2. **Locate the Lambda Function**:
   - Find the Lambda function named `InfinopsAutoTagProjectTagging`.

3. **Run the Lambda Function**:
   - Click on the `InfinopsAutoTagProjectTagging` function.
   - Press the `Test` button to execute the function manually.

### Result

By following these steps, the Lambda function will tag all available resources with the `project` tag based on the project names defined in DynamoDB. The Lambda function ensures that all resources are appropriately tagged, either automatically on an hourly basis or manually if needed.

This guide ensures that your AWS resources are organized and easily identifiable by project, facilitating better resource management and cost allocation.
