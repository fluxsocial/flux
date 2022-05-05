import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";
import { ad4mClient } from "@/app";

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async (communityId: string): Promise<void> => {
  const dataStore = useDataStore();

  try {
    //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
    const community = dataStore.getCommunity(communityId);
    console.log(community);
    const channelLinks = await ad4mClient.perspective.queryLinks(
      community.neighbourhood.perspective.uuid,
      new LinkQuery({
        source: community.neighbourhood.neighbourhoodUrl,
        predicate: "sioc://has_space",
      })
    );
    console.log(channelLinks);

    for (let i = 0; i < channelLinks.length; i++) {
      //Check that the channel is not in the store
      if (
        Object.values(community.neighbourhood.linkedNeighbourhoods).find(
          (neighbourhoodUrl) =>
            neighbourhoodUrl === channelLinks[i].data!.target
        ) === undefined
      ) {
        console.log(
          "Found channel link from un-joined channel neighbourhood",
          channelLinks[i]
        );
        //Call ad4m and try to join the sharedperspective found at link target
        await dataStore.joinChannelNeighbourhood({
          parentCommunityId: communityId,
          neighbourhoodUrl: channelLinks[i].data!.target,
        });
      }
    }
  } catch (error) {
    throw new Error(error);
  }
};
