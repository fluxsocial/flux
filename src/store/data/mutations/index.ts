import {
  ExpressionAndRef,
  LinkExpressionAndLang,
  CommunityState,
  ChannelState,
  ThemeState,
  LocalCommunityState,
  LocalChannelState,
} from "@/store/types";

import { parseExprUrl } from "@perspect3vism/ad4m";
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

  clearMessages(): void {
    const state = useDataStore();
    for (const neighbourhood of Object.values(state.neighbourhoods)) {
      neighbourhood.currentExpressionMessages = {};
    }
  },

  addMessages(payload: AddChannelMessages): void {
    const state = useDataStore();
    const neighbourhood = state.neighbourhoods[payload.channelId];

    const expressions: { [x: string]: any } = {};
    const links: { [x: string]: any } = {};

    for (const [index, exp] of Object.entries(payload.expressions)) {
      if (exp != null) {
        const target = payload.links[parseInt(index)].data.target!;
        expressions[target] = {
          expression: {
            author: exp.author!,
            data: JSON.parse(exp.data!),
            timestamp: exp.timestamp!,
            proof: exp.proof!,
          } as Expression,
          url: parseExprUrl(target),
        };

        links[target] = payload.links[parseInt(index)];
      }
    }

    neighbourhood.currentExpressionLinks = {
      ...neighbourhood.currentExpressionLinks,
      ...links,
    };
    neighbourhood.currentExpressionMessages = {
      ...neighbourhood.currentExpressionMessages,
      ...expressions,
    };
  },

  addMessage(payload: AddChannelMessage): void {
    const state = useDataStore();
    const neighbourhood = state.neighbourhoods[payload.channelId];

    neighbourhood.currentExpressionLinks[payload.link.data.target] =
      payload.link;
    neighbourhood.currentExpressionMessages[payload.link.data.target] = {
      expression: {
        author: payload.expression.author!,
        data: JSON.parse(payload.expression.data!),
        timestamp: payload.expression.timestamp!,
        proof: payload.expression.proof!,
      } as Expression,
      url: parseExprUrl(payload.link.data!.target!),
    };
  },

  setCurrentChannelId(payload: {
    communityId: string;
    channelId: string;
  }): void {
    const state = useDataStore();
    const { communityId, channelId } = payload;
    state.communities[communityId].currentChannelId = channelId;
  },

  removeCommunity(id: string): void {
    const state = useDataStore();
    delete state.communities[id];
    delete state.neighbourhoods[id];
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

  addChannel(payload: AddChannel): void {
    const state = useDataStore();
    const parentNeighbourhood = state.neighbourhoods[payload.communityId];

    if (parentNeighbourhood !== undefined) {
      if (
        parentNeighbourhood.linkedNeighbourhoods.indexOf(
          payload.channel.neighbourhood.neighbourhoodUrl
        ) === -1
      ) {
        parentNeighbourhood.linkedNeighbourhoods.push(
          payload.channel.neighbourhood.neighbourhoodUrl
        );
      }

      if (
        parentNeighbourhood.linkedPerspectives.indexOf(
          payload.channel.neighbourhood.perspective.uuid
        ) === -1
      ) {
        parentNeighbourhood.linkedPerspectives.push(
          payload.channel.neighbourhood.perspective.uuid
        );
      }

      state.channels[payload.channel.neighbourhood.perspective.uuid] =
        payload.channel.state;

      state.neighbourhoods[payload.channel.neighbourhood.perspective.uuid] =
        payload.channel.neighbourhood;
    }
  },

  addLocalChannel(payload: {
    perspectiveUuid: string;
    channel: LocalChannelState;
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
    state.channels[payload.neighbourhood.perspective.uuid] = payload.state;
    state.neighbourhoods[payload.neighbourhood.perspective.uuid] =
      payload.neighbourhood;
  },

  setuseLocalTheme(payload: { communityId: string; value: boolean }): void {
    const state = useDataStore();
    const community = state.communities[payload.communityId];
    community.useLocalTheme = payload.value;
  },

  setHasNewMessages(payload: { channelId: string; value: boolean }): void {
    const state = useDataStore();
    const tempChannel = state.getChannel(payload.channelId);
    const tempCommunity = state.getCommunity(
      tempChannel.neighbourhood.membraneRoot
    );
    const channel = state.channels[payload.channelId];
    const community = state.communities[tempCommunity.state.perspectiveUuid];
    channel.hasNewMessages = payload.value;
    community.hasNewMessages = state
      .getChannelNeighbourhoods(tempCommunity.state.perspectiveUuid)
      .reduce((acc: boolean, curr) => {
        const channel = state.channels[curr.perspective.uuid];
        if (!acc) return channel.hasNewMessages;
        return true;
      }, false);
  },

  addExpressionAndLink: (payload: {
    channelId: string;
    link: LinkExpression;
    message: Expression;
  }): void => {
    const state = useDataStore();
    const channel = state.neighbourhoods[payload.channelId];
    console.log("Adding to link and exp to channel!", payload.message);
    channel.currentExpressionLinks[payload.link.data.target!] = {
      expression: payload.link,
      language: "na",
    } as LinkExpressionAndLang;
    //TODO: make gql expression to ad4m expression conversion function
    channel.currentExpressionMessages[payload.link.data.target] = {
      expression: {
        author: payload.message.author!,
        data: JSON.parse(payload.message.data!),
        timestamp: payload.message.timestamp!,
        proof: payload.message.proof!,
      } as Expression,
      url: parseExprUrl(payload.link.data!.target!),
    } as ExpressionAndRef;
  },
};
