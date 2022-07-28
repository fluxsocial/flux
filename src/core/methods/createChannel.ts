// TODO: remove profile code

import { ChannelState, FeedType } from "@/store/types";
import type { PerspectiveHandle } from "@perspect3vism/ad4m";
import { ad4mClient } from "@/app";
import {
  AD4M_CLASS,
  CHANNEL,
  CHANNEL_NAME,
  SELF,
  FLUX_CHANNEL,
} from "@/constants/neighbourhoodMeta";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";

interface ChannelProps {
  channelName: string;
  creatorDid: string;
  sourcePerspective: PerspectiveHandle;
}

export async function createChannel({
  channelName,
  creatorDid,
  sourcePerspective,
}: ChannelProps): Promise<ChannelState> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  const channel = dataStore.channels[channelName];
  if (!channel || channel.sourcePerspective !== sourcePerspective.uuid) {
    const linkExpression = await ad4mClient.perspective.addLink(
      sourcePerspective.uuid,
      {
        source: SELF,
        target: channelName,
        predicate: CHANNEL,
      }
    );
    const linkExpressionChannelName = await ad4mClient.perspective.addLink(
      sourcePerspective.uuid,
      {
        source: channelName,
        target: channelName,
        predicate: CHANNEL_NAME,
      }
    );
    const linkExpressionChannelClass = await ad4mClient.perspective.addLink(
      sourcePerspective.uuid,
      {
        source: channelName,
        target: FLUX_CHANNEL,
        predicate: AD4M_CLASS,
      }
    );

    console.debug(
      "Created new link on source social-context with result",
      linkExpression,
      linkExpressionChannelName,
      linkExpressionChannelClass
    );

    return {
      name: channelName,
      description: "",
      creatorDid,
      id: channelName,
      createdAt: new Date().toISOString(),
      sourcePerspective: sourcePerspective.uuid,
      hasNewMessages: false,
      feedType: FeedType.Signaled,
      notifications: {
        mute: false,
      },
    } as ChannelState;
  }

  const errorMessage = "Channel with this name already exists";

  appStore.showDangerToast({
    message: errorMessage,
  });

  throw new Error(errorMessage);
}
