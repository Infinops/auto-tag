# Automatic Execution of Lambda Function for Tagging New Resources

This guide describes the process of automatically executing a Lambda function to tag newly created resources. This Lambda function ensures that all new resources are tagged appropriately with key-value pairs for better management and organization.

## Overview

The Lambda function can be configured in two ways:
1. **Including All Files from the Directory**: All relevant files from the specified directory can be added to the Lambda function.
2. **Automatic Creation During Deployment**: The Lambda function is automatically created and configured during the execution of the deployment script available at [deploy_autotag.sh](https://github.com/Infinops/auto-tag/blob/infinops-main/deploy_autotag.sh).

This guide will focus on the method of automatically creating the Lambda function during the execution of the deployment script.

## Automatic Creation and Execution During Deployment

### Step-by-Step Process:

1. **Deploy the Script**:
   - Execute the deployment script as per the instructions provided in the repository. This script will handle the creation and configuration of the Lambda function for tagging new resources.

2. **Automatic Trigger on Resource Creation**:
   - Once the deployment script completes, the Lambda function will be set up to trigger automatically whenever a new resource is created.
   - Upon the creation of a new resource, the Lambda function will run and apply the necessary tags to the resource.

### Tagging Details:

- **Key-Value Format**: Tags are applied in a key-value format, ensuring that each resource is identifiable and organized.
- **Default Values**:
  - The default value for each key is set to “unset”.
  - For the `Name` tag, the value is derived from the resource's name, ensuring that the resource is easily identifiable.

## Conclusion

This guide ensures that your AWS resources are properly tagged from the moment they are created, enhancing resource management and cost allocation.

