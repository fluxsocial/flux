import { createChannel } from "@/core/methods/createChannel";
import { useAppStore } from "@/store/app";
import { ChannelState, MembraneType } from "@/store/types";
import { useDataStore } from "..";
import { useUserStore } from "@/store/user";
import { ad4mClient } from "@/app";

export interface Payload {
  communityId: string;
  name: string;
}

export default async (payload: Payload): Promise<ChannelState> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();
  try {
    const community = dataStore.getCommunity(payload.communityId);

    const agent = await ad4mClient.agent.me()

    const creatorDid = agent.did;

    if (community.neighbourhood !== undefined) {
      const channel = await createChannel({
        channelName: payload.name,
        creatorDid,
        sourcePerspective: community.neighbourhood.perspective,
      });

      dataStore.addChannel({
        communityId: community.neighbourhood.perspective.uuid,
        channel,
      });

      return channel;
    } else {
      const message = "Community does not exists";
      appStore.showDangerToast({
        message,
      });
      throw Error(message);
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
