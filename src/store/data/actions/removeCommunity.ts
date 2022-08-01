import { ad4mClient, MainClient } from "@/app";
import { CHANNEL, SELF } from "@/constants/neighbourhoodMeta";
import { useAppStore } from "@/store/app";

import { ExpressionTypes } from "@/store/types";
import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";

export interface Payload {
  communityId: string;
  name?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
}

export default async function removeCommunity({
  communityId,
}: Payload): Promise<void> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    delete dataStore.communities[communityId];
    delete dataStore.neighbourhoods[communityId];
  
    const channels = await MainClient.ad4mClient.perspective.queryLinks(communityId, new LinkQuery({
      source: SELF,
      predicate: CHANNEL
    }));
  
    const promises = [];
  
    for (const channel of channels) {
      promises.push(MainClient.ad4mClient.perspective.removeLink(communityId, channel));
    }
  
    await Promise.all(promises);
    
    for (const channel of Object.values(dataStore.channels)) {
      if (channel.sourcePerspective === communityId) {
        delete dataStore.channels[channel.id];
      }
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
