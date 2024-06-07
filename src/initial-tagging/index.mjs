import { EC2 } from "@aws-sdk/client-ec2";
import {fetchResourcesInRegion} from './resource.mjs'
import {tagResource} from './tagging.mjs'


export const handler = async (event, context) => {
    try {
        
        const defaultCheckTags = ['Owner','Project','Paid'];
        const defaultNewTags = [{Key:'Owner',Value:'unset'}, 
        {Key:'Name',Value:'unset'}, 
        {Key:'Project',Value:'unset'}, 
        {Key:'Project-Status',Value:'unset'},
        {Key:'Team',Value:'unset'},
        {Key:'Application',Value:'unset'}, 
        {Key:'Application-Owner',Value:'unset'},
        {Key:'Environment',Value:'unset'},
        {Key:'User-Data',Value:'unset'}, 
        {Key:'Critical-Status',Value:'unset'},
        {Key:'Lifecycle',Value:'unset'},
        {Key:'Compliance',Value:'unset'}, 
        {Key:'Paid',Value:'unset'}]
        let checkTags = [];
        let newTags = [];
        console.log(event);
        
        if (event.checkTags != undefined && event.checkTags != null && event.checkTags.length > 0) {
            checkTags = event.checkTags
        } else {
            checkTags = defaultCheckTags;
        }
        
        if (event.newTags != undefined && event.newTags != null && event.newTags.length > 0) {
            newTags = event.newTags
        } else {
            newTags = defaultNewTags;
        }
        let regions = await fetchRegions(); // Fetch regions from EC2, can use any service
        let resourcesFinal = [];
        for (let region of regions) {
            const resourcesInRegion = await fetchResourcesInRegion( region);
            console.log(region,resourcesInRegion)
            resourcesInRegion.forEach((element) => element.region=region);
           resourcesFinal =  resourcesFinal.concat(resourcesInRegion);
        } 
        let resourcesFiltered = filterResourcesByUnsettTags(resourcesFinal, checkTags);
        console.log('resourcesFinal', resourcesFinal);
        console.log('resourcesFiltered', resourcesFiltered);
        const taggingPromises = resourcesFiltered.map(async resource => {
           return  await tagResource(resource, newTags);
        })
        
        const taggingResult = (await Promise.all(taggingPromises)).flat();
        console.log(taggingResult);
        return { statusCode: 200, body: resourcesFiltered };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: 'Error' };
    }
};

//Filters resource list and returns resources that dont have at least one of the tags from tagList
function filterResourcesByUnsettTags(resourceList,tagList) {
    return resourceList.map(resource => {
        if (tagList.some(tag=> !resource.Tags.find(x=>x.Key == tag && x.Value!=null && x.Value!='null' && x.Value!=undefined))) {
            return resource;
        }
        else {
            return null;
        }
    }).filter(resource=> resource!=null);
}

async function fetchRegions() {
    const ec2Client = new EC2({});
    const response = await ec2Client.describeRegions({});
    return response.Regions.map(region => region.RegionName);
}
