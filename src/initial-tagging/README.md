# Running the Lambda Function for Initial Tagging of Resources

This guide describes the process of running the Lambda function responsible for the initial tagging of resources. This function works with resources that have already been tagged. All files from the specified directory can be added to the Lambda function, or the Lambda function can be created automatically during the execution of the deployment script available at [deploy_autotag.sh](https://github.com/Infinops/auto-tag/blob/infinops-main/deploy_autotag.sh). This guide will focus on the method of automatically creating the Lambda function during the execution of the deployment script. We will also cover both automatic and manual methods of running the Lambda function.

## Automatic Creation and Execution

### Step-by-Step Process:

1. **Deploy the Script**:
   - Execute the deployment script as per the instructions provided in the repository. This will automatically create the necessary Lambda function for initial tagging.

2. **Automatic Execution**:
   - After the deployment script completes, the Lambda function will run automatically. During its execution, it will tag all available created resources with key-value pairs.
   - The default value for each key is set to “unset”. For the `Name` tag, the value is set to the resource's name.

## Manual Execution

### Step-by-Step Process:

1. **Access the AWS Lambda Console**:
   - Navigate to the AWS Lambda console in the region where the deployment was executed: [AWS Lambda Console (us-west-2)](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions).

2. **Locate the Lambda Function**:
   - Find the Lambda function named `InfinopsAutoTagInitialTagging`.

3. **Run the Lambda Function**:
   - Click on the `InfinopsAutoTagInitialTagging` function.
   - Press the `Test` button to execute the function manually.


### Result:

By following these steps, whether through automatic or manual execution, the Lambda function will tag all available resources with the appropriate key-value pairs. The default value for each key is set to “unset”, and the `Name` tag is derived from the resource's name.

This guide ensures that your AWS resources are properly tagged, enhancing resource management and cost allocation.
