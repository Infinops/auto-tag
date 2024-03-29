import { EC2 } from "@aws-sdk/client-ec2";
import { fetchResourcesInRegion } from './resource.mjs'
import { tagResource } from './tagging.mjs'


export const handler = async (event, context) => {
    try {

        const defaultProjectTag = 'project';
        const defaultProjectEmptyValue = 'unknown';
        const projectList = event.projectList || [];
        let projectTagName = defaultProjectTag;
        let projectTagEmptyValue = defaultProjectEmptyValue;
        

        if (event.projectTagName != undefined && event.projectTagName != null && event.projectTagName.length > 0) {
            projectTagName = event.projectTagName
        }

        if (event.projectTagEmptyValue != undefined && event.projectTagEmptyValue != null && event.projectTagEmptyValue.length > 0) {
            projectTagEmptyValue = event.projectTagEmptyValue
        }
        let regions = await fetchRegions(); // Fetch regions from EC2, can use any service
        let resourcesFinal = [];
        for (let region of regions) {
            const resourcesInRegion = await fetchResourcesInRegion(region, projectTagName, projectTagEmptyValue);
            resourcesInRegion.forEach((element) => element.region = region);
            resourcesFinal = resourcesFinal.concat(resourcesInRegion);
        }
        console.log('resourcesFinal', resourcesFinal.filter(resource => resource.Tags.find(tag => tag.Key.toLowerCase() === 'name')).length);
        console.log('resourcesFinal', resourcesFinal.filter(resource => resource.Tags.find(tag => tag.Key.toLowerCase() === 'name')));
        const taggingPromises = resourcesFinal.filter(resource => resource.Tags.find(tag => tag.Key.toLowerCase() === 'name')).map(async resource => {
            const result =  await tagResource(resource, projectList, projectTagName);
            console.log(result);
            return result
        })
        const taggingResult = (await Promise.all(taggingPromises)).flat();
        return { statusCode: 200, body: taggingResult };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: 'Error' };
    }
};


async function fetchRegions() {
    const ec2Client = new EC2({});
    const response = await ec2Client.describeRegions({});
    return response.Regions.map(region => region.RegionName);
}
