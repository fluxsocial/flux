<template>
  <j-popover
    :open="showCommunityMenu"
    @toggle="(e) => (showCommunityMenu = e.target.open)"
    class="community-sidebar__header"
    :class="{ 'is-creator': isCreator }"
    event="click"
    placement="bottom-start"
  >
    <button slot="trigger" class="community-sidebar__header-button">
      <j-avatar
        style="--j-avatar-size: 30px"
        :src="community.neighbourhood.image || null"
        :initials="community.neighbourhood.name.charAt(0)"
      />
      <div class="community-info">
        {{ community.neighbourhood.name }}
      </div>
      <j-icon size="xs" name="chevron-down"></j-icon>
    </button>
    <j-menu slot="content">
      <j-menu-item v-if="isCreator" @click="() => setShowEditCommunity(true)">
        <j-icon size="xs" slot="start" name="pencil" />
        Edit community
      </j-menu-item>
      <j-menu-item @click="goToSettings">
        <j-icon size="xs" slot="start" name="gear" />
        Settings
      </j-menu-item>
      <j-menu-item @click="() => setShowInviteCode(true)">
        <j-icon size="xs" slot="start" name="person-plus" />
        Invite people
      </j-menu-item>
      <j-divider />
      <j-menu-item @click="() => setShowCreateChannel(true)">
        <j-icon size="xs" slot="start" name="plus" />
        Create channel
      </j-menu-item>
      <j-menu-item
        @click="
          () =>
            toggleHideMutedChannels({
              communityId: community.neighbourhood.perspective.uuid,
            })
        "
      >
        <j-icon
          size="xs"
          slot="start"
          :name="community.state.hideMutedChannels ? 'toggle-on' : 'toggle-off'"
        />
        Hide muted channels
      </j-menu-item>
    </j-menu>
  </j-popover>

  <j-box pt="500">
    <j-menu-group-item
      open
      :title="`Members (${community.neighbourhood.members.length})`"
    >
      <j-button
        @click.prevent="() => setShowInviteCode(true)"
        size="sm"
        slot="end"
        variant="ghost"
      >
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>
      <j-box px="500">
        <avatar-group
          @click="() => setShowCommunityMembers(true)"
          :users="community.neighbourhood.members"
        />
      </j-box>
    </j-menu-group-item>
  </j-box>

  <j-box pt="500">
    <j-menu-group-item open title="Channels">
      <j-button
        @click.prevent="() => setShowCreateChannel(true)"
        size="sm"
        slot="end"
        variant="ghost"
      >
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>
      <router-link
        :to="{
          name: 'channel',
          params: {
            communityId: community.neighbourhood.perspective.uuid,
            channelId: channel.name,
          },
        }"
        custom
        v-slot="{ navigate, isExactActive }"
        v-for="channel in channels"
        :key="channel.id"
      >
        <j-popover
          class="community-sidebar__header-menu"
          event="contextmenu"
          placement="bottom-start"
        >
          <j-menu-item
            slot="trigger"
            class="channel"
            :class="{ 'channel--muted': channel.notifications?.mute }"
            :selected="isExactActive"
            @click="navigate"
          >
            <j-icon slot="start" size="sm" name="hash"></j-icon>
            {{
              channel.name
            }}
            <j-icon
              size="xs"
              slot="end"
              v-if="channel?.notifications?.mute"
              name="bell-slash"
            />
            <div
              slot="end"
              class="channel__notification"
              v-if="channel.hasNewMessages"
            ></div>
          </j-menu-item>
          <j-menu slot="content">
            <j-menu-item
              @click="
                () =>
                  setChannelNotificationState({
                    channelId: channel.id,
                  })
              "
            >
              <j-icon
                size="xs"
                slot="start"
                :name="
                  channel?.notifications?.mute ? 'bell-slash' : 'bell'
                "
              />
              {{
                `${
                  channel?.notifications?.mute ? "Unmute" : "Mute"
                } Channel`
              }}
            </j-menu-item>
          </j-menu>
        </j-popover>
      </router-link>
    </j-menu-group-item>
    <j-menu-item @click="() => setShowCreateChannel(true)">
      <j-icon size="xs" slot="start" name="plus" />
      Add channel
    </j-menu-item>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import {
  ChannelState,
  CommunityState,
  ExpressionTypes,
  FluxExpressionReference,
} from "@/store/types";
import { mapActions, mapState } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";

export default defineComponent({
  components: { AvatarGroup },
  props: {
    community: {
      type: Object as PropType<CommunityState>,
      required: true,
    },
  },
  setup() {
    return {
      userStore: useUserStore(),
    };
  },
  data: function () {
    return {
      showCommunityMenu: false,
    };
  },
  computed: {
    channels(): ChannelState[] {
      const communityId = this.$route.params.communityId as string;

      const channels = this.getChannelStates()(communityId);

      if (this.community.state.hideMutedChannels) {
        return channels.filter((e) => !e.notifications.mute);
      }

      return channels;
    },
    isCreator(): boolean {
      return (
        this.community.neighbourhood.creatorDid ===
        this.userStore.getUser?.agent.did
      );
    },
  },
  methods: {
    ...mapActions(useDataStore, [
      "setChannelNotificationState",
      "toggleHideMutedChannels",
    ]),
    ...mapState(useDataStore, ["getChannelStates"]),
    ...mapActions(useAppStore, [
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
    ]),
    goToSettings() {
      this.setShowCommunitySettings(true);
      this.showCommunityMenu = false;
    },
  },
});
</script>

<style lang="scss" scoped>
.community-sidebar__header {
  z-index: 1;
  background: var(--app-drawer-bg-color);
  display: block;
  position: sticky;
  top: 0;
  left: 0;
}

.community-sidebar__header-button {
  color: inherit;
  width: 100%;
  height: 74px;
  display: flex;
  align-items: center;
  gap: var(--j-space-400);
  border: 0;
  outline: 0;
  font-family: inherit;
  text-align: left;
  background: none;
  cursor: pointer;
  padding: 0 var(--j-space-500);
  border-bottom: 1px solid var(--app-drawer-border-color);
}

.community-sidebar__header:hover {
  background: rgba(128, 128, 128, 0.05);
}

.community-info {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-weight: 500;
  color: var(--j-color-ui-800);
  font-size: var(--j-font-size-500);
  text-overflow: ellipsis;
}

j-divider {
  display: block;
  width: 100%;
  border-bottom: 1px solid var(--j-color-ui-100);
  margin-top: var(--j-space-300);
  margin-bottom: var(--j-space-300);
}

.channel {
  position: relative;
  display: block;
}

.channel--muted {
  opacity: 0.6;
}

.channel__notification {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--j-color-primary-500);
}
</style>
