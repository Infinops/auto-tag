import { ResourceGroupsTaggingAPIClient, TagResourcesCommand } from "@aws-sdk/client-resource-groups-tagging-api"; // ES Modules import


export async function tagResource(resource, projectList, projectTagName) {
  const { ResourceARN, region } = resource;
  const clientConfig = {
    region,
    maxAttempts: 5,
  }
  let newProjectTag = '';
  let firstIndex = 250;
  let nameTag = resource.Tags.find(r => r.Key.toLowerCase() === 'name').Value.toLowerCase();
  console.log(nameTag);
  for (let project of projectList) {
    if (nameTag.includes(project.toLowerCase())) {
      const newIndex = nameTag.indexOf(project);
      if (newIndex < firstIndex) {
        firstIndex = newIndex;
        newProjectTag = project;
      }
    }
  }

  if (newProjectTag === '') {
    console.log(resource.Tags);
    return { ResourceARN, region, oldProjectTag: resource.Tags[projectTagName], newProjectTag, response: 'Failed to find correct project name' }
  }
  try {
    const client = new ResourceGroupsTaggingAPIClient(clientConfig);
    const tags = { [projectTagName]: newProjectTag };
    const input = { // TagResourcesInput
      ResourceARNList: [ // ResourceARNListForTagUntag // required
        ResourceARN,
      ],
      Tags: tags,
    };
    const command = new TagResourcesCommand(input);
    const response = await client.send(command);
    console.log(response);
    return { ResourceARN, region, oldProjectTag: resource.Tags[projectTagName], newProjectTag, response };
  }
  catch (error) {
    console.error(error);
    return { ResourceARN, region, oldProjectTag: resource.Tags[projectTagName], newProjectTag, error: error }
  }

}
