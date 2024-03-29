import { ResourceGroupsTaggingAPIClient, TagResourcesCommand } from "@aws-sdk/client-resource-groups-tagging-api"; // ES Modules import


export async function tagResource(resource, tagList) {
    const { ResourceARN, region } = resource;
    const clientConfig = {
     region,
     maxAttempts: 50,
   }
    const client = new ResourceGroupsTaggingAPIClient(clientConfig);
    const tags = Object.fromEntries(tagList.filter(tag => !resource.Tags.some(x => x.Key == tag.Key)).map(tag => [tag.Key, tag.Value]));
    const input = { // TagResourcesInput
      ResourceARNList: [ // ResourceARNListForTagUntag // required
         ResourceARN,
      ],
      Tags: tags,
    };
    const command = new TagResourcesCommand(input);
    const response = await client.send(command);
    console.log(response);
    return response;

}
