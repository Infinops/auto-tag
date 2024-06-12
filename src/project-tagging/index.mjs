import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ec2Client } from './clients.mjs';
import { fetchResourcesInRegion } from './resource.mjs';
import { tagResource } from './tagging.mjs';

export const handler = async (event, _context) => {
    try {
        const defaultProjectTag = 'Project';
        const defaultProjectEmptyValue = 'unset';
        let projectTagName = defaultProjectTag;
        let projectTagEmptyValue = defaultProjectEmptyValue;
        const projectList = (await getProjectList()).Items.map(item => item.project.S);
        if (projectList.length === 0) {
            return { statusCode: 500, body: 'Empty project list' };
        }
        if (event.projectTagName != undefined && event.projectTagName != null && event.projectTagName.length > 0) {
            projectTagName = event.projectTagName;
        }

        if (event.projectTagEmptyValue != undefined && event.projectTagEmptyValue != null && event.projectTagEmptyValue.length > 0) {
            projectTagEmptyValue = event.projectTagEmptyValue;
        }
        const regions = await fetchRegions(); // Fetch regions from EC2, can use any service
        let resourcesFinal = [];
        for (const region of regions) {
            const resourcesInRegion = await fetchResourcesInRegion(region, projectTagName, projectTagEmptyValue);
            resourcesInRegion.forEach(element => element.region = region);
            resourcesFinal = resourcesFinal.concat(resourcesInRegion);
        }
        console.log('resourcesFinal', resourcesFinal.filter(resource => resource.Tags.find(tag => tag.Key.toLowerCase() === 'name')).length);
        console.log('resourcesFinal', resourcesFinal.filter(resource => resource.Tags.find(tag => tag.Key.toLowerCase() === 'name')));
        const taggingPromises = resourcesFinal.filter(resource => resource.Tags.find(tag => tag.Key.toLowerCase() === 'name')).map(async resource => {
            const result = await tagResource(resource, projectList, projectTagName);
            console.log(result);
            return result;
        });
        const taggingResult = (await Promise.all(taggingPromises)).flat();
        return { statusCode: 200, body: taggingResult };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: 'Error' };
    }
};


async function fetchRegions() {
    const response = await ec2Client.describeRegions({});
    return response.Regions.map(region => region.RegionName);
}

async function getProjectList() {
    const client = new DynamoDBClient({
        region: process.env.REGION
    });
    const input = { // ScanInput
        TableName: process.env.DYNAMO_TABLE, // required
        Select: 'ALL_ATTRIBUTES',
        ReturnConsumedCapacity: 'NONE',
    };
    const command = new ScanCommand(input);
    const response = await client.send(command);
    return response;
}
