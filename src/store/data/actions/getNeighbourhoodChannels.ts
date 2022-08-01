import { print } from "graphql/language/printer";
import { PERSPECTIVE_LINK_QUERY } from "@/core/graphql_queries";
import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";
import { channelRefreshDurationMs } from "@/constants/config";
import { CHANNEL, SELF } from "@/constants/neighbourhoodMeta";
import { FeedType } from "@/store/types";
import { nanoid } from "nanoid";

export interface Payload {
  communityId: string;
}

const token = localStorage.getItem("ad4minToken");

const channelLinksWorker = new Worker("/pollingWorker.js");

const PORT = localStorage.getItem("ad4minPort");

/// Function that uses web workers to poll for channels and new group expressions on a community
export default async ({ communityId }: Payload): Promise<Worker> => {
  const dataStore = useDataStore();

  try {
    //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
    const community = dataStore.getCommunity(communityId);

    //Start the worker looking for channels
    channelLinksWorker.postMessage({
      interval: channelRefreshDurationMs,
      staticSleep: true,
      query: print(PERSPECTIVE_LINK_QUERY),
      token,
      variables: {
        uuid: community.neighbourhood.perspective.uuid,
        query: new LinkQuery({
          source: SELF,
          predicate: CHANNEL,
        }),
      },
      callbackData: { communityId: community.neighbourhood.perspective.uuid },
      name: `Channel links for ${community.neighbourhood.name}`,
      dataKey: "perspectiveQueryLinks",
      port: PORT,
    });

    channelLinksWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    channelLinksWorker.addEventListener("message", async (e) => {
      //Check that no other worker callback is executing

      try {
        const channelLinks = e.data.perspectiveQueryLinks;
        console.log("Channel links", channelLinks);

        console.log(channelLinks);

        for (let i = 0; i < channelLinks.length; i++) {
          const name = channelLinks[i].data!.target;
          //Check that the channel is not in the store
          if (dataStore.channels[name] === undefined) {
            console.log(
              "Found channel link from un-joined channel neighbourhood",
              channelLinks[i]
            );
            dataStore.addChannel({
              communityId: community.state.perspectiveUuid,
              channel: {
                id: nanoid(),
                name,
                creatorDid: channelLinks[i].author,
                sourcePerspective: community.state.perspectiveUuid,
                hasNewMessages: false,
                createdAt: new Date().toISOString(),
                feedType: FeedType.Signaled,
                notifications: {
                  mute: false,
                },
              },
            });
          }
        }
      } catch (error) {
        throw new Error(error);
      }
    });
    return channelLinksWorker;
  } catch (e) {
    throw new Error(e);
  }
};
