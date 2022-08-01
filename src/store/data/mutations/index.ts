import {
  CommunityState,
  ThemeState,
  LocalCommunityState,
  ChannelState,
} from "@/store/types";

import type { Expression, LinkExpression } from "@perspect3vism/ad4m";
import { useDataStore } from "..";

interface UpdatePayload {
  communityId: string;
  name: string;
  description: string;
  image: string;
  thumbnail: string;
  groupExpressionRef: string;
}

interface AddChannel {
  communityId: string;
  channel: ChannelState;
}

interface AddChannelMessages {
  channelId: string;
  links: LinkExpression[];
  expressions: Expression[];
}

interface AddChannelMessage {
  channelId: string;
  link: LinkExpression;
  expression: Expression;
}

export default {
  addCommunity(payload: CommunityState): void {
    const state = useDataStore();
    state.neighbourhoods[payload.neighbourhood.perspective.uuid] =
      payload.neighbourhood;
    state.communities[payload.neighbourhood.perspective.uuid] = payload.state;
  },

  addCommunityState(payload: LocalCommunityState): void {
    const state = useDataStore();
    state.communities[payload.perspectiveUuid] = payload;
  },

  setCurrentChannelId(payload: {
    communityId: string;
    channelId: string;
  }): void {
    const state = useDataStore();
    const { communityId, channelId } = payload;
    state.communities[communityId].currentChannelId = channelId;
  },

  setChannelNotificationState({ channelId }: { channelId: string }): void {
    const state = useDataStore();
    const channel = state.channels[channelId];

    channel.notifications.mute = !channel.notifications.mute;
  },

  toggleCommunityMute({ communityId }: { communityId: string }): void {
    const state = useDataStore();
    const community = state.communities[communityId];

    if (community.notifications) {
      community.notifications.mute = !community.notifications.mute;
    } else {
      community.notifications = { mute: true };
    }
  },

  setNeighbourhoodMember({
    member,
    perspectiveUuid,
  }: {
    member: string;
    perspectiveUuid: string;
  }): void {
    const state = useDataStore();
    const neighbourhood = state.neighbourhoods[perspectiveUuid];

    if (
      neighbourhood &&
      !neighbourhood.members.find((existingMember) => existingMember === member)
    ) {
      neighbourhood.members.push(member);
    }
  },

  setCommunityTheme(payload: { communityId: string; theme: ThemeState }): void {
    const state = useDataStore();
    state.communities[payload.communityId].theme = {
      ...state.communities[payload.communityId].theme,
      ...payload.theme,
    };
  },

  updateCommunityMetadata({
    communityId,
    name,
    description,
    image,
    thumbnail,
    groupExpressionRef,
  }: UpdatePayload): void {
    const state = useDataStore();
    const community = state.neighbourhoods[communityId];

    if (community) {
      community.name = name;
      community.description = description;
      community.image = image;
      community.thumbnail = thumbnail;
      community.groupExpressionRef = groupExpressionRef;
    }

    state.neighbourhoods[communityId] = community;
  },

  setChannelScrollTop(payload: { channelId: string; value: number }): void {
    const state = useDataStore();
    state.channels[payload.channelId].scrollTop = payload.value;
  },

  clearChannels({communityId}: {communityId: string}): void {
    const state = useDataStore();
    Object.values(state.channels).forEach(c => {
      if (c.sourcePerspective === communityId) {
        delete state.channels[c.id]
      }
    });
  },

  addChannel(payload: AddChannel): void {
    const state = useDataStore();
    const parentNeighbourhood = state.neighbourhoods[payload.communityId];

    if (parentNeighbourhood !== undefined) {
      const exists = Object.values(state.channels).find(c => c.name === payload.channel.name && c.sourcePerspective === payload.communityId);

      if (!exists) {
        state.channels[payload.channel.id] =
          payload.channel;
      }
    }
  },

  addLocalChannel(payload: {
    perspectiveUuid: string;
    channel: ChannelState;
  }): void {
    const state = useDataStore();
    state.channels[payload.perspectiveUuid] = payload.channel;
  },

  toggleHideMutedChannels(payload: { communityId: string }): void {
    const state = useDataStore();
    const community = state.communities[payload.communityId];
    community.hideMutedChannels = !community.hideMutedChannels;
  },

  createChannelMutation(payload: ChannelState): void {
    const state = useDataStore();
    state.channels[payload.id] = payload;
  },

  setuseLocalTheme(payload: { communityId: string; value: boolean }): void {
    const state = useDataStore();
    const community = state.communities[payload.communityId];
    community.useLocalTheme = payload.value;
  },

  setHasNewMessages(payload: { communityId: string, channelId: string; value: boolean }): void {
    const state = useDataStore();
    const channel = state.getChannel(payload.communityId, payload.channelId);
    const tempCommunity = state.getCommunity(payload.communityId);
    const community = state.communities[tempCommunity.state.perspectiveUuid];
    channel!.hasNewMessages = payload.value;
    community.hasNewMessages = state
      .getChannelStates(tempCommunity.state.perspectiveUuid)
      .reduce((acc: boolean, channel) => {
        if (!acc) return channel.hasNewMessages;
        return true;
      }, false);
  },
};
