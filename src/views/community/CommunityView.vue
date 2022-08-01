<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <community-sidebar :community="community"></community-sidebar>
    </template>
    <router-view :key="$route.fullPath"></router-view>
  </sidebar-layout>

  <j-modal
    :open="modals.showCommunityMembers"
    @toggle="(e) => setShowCommunityMembers(e.target.open)"
  >
    <community-members v-if="modals.showCommunityMembers" />
  </j-modal>

  <j-modal
    size="sm"
    :open="modals.showEditCommunity"
    @toggle="(e) => setShowEditCommunity(e.target.open)"
  >
    <edit-community
      v-if="modals.showEditCommunity"
      @submit="() => setShowEditCommunity(false)"
      @cancel="() => setShowEditCommunity(false)"
    />
  </j-modal>

  <j-modal
    :open="modals.showCreateChannel"
    @toggle="(e) => setShowCreateChannel(e.target.open)"
  >
    <create-channel
      v-if="modals.showCreateChannel"
      @submit="() => setShowCreateChannel(false)"
      @cancel="() => setShowCreateChannel(false)"
    />
  </j-modal>

  <j-modal
    size="sm"
    :open="modals.showInviteCode"
    @toggle="(e) => setShowInviteCode(e.target.open)"
  >
    <j-box p="800">
      <j-text variant="heading">Invite people</j-text>
      <j-text variant="ingress">
        Copy and send this code to the people you want to join your community
      </j-text>
      <j-input
        @click="(e) => e.target.select()"
        size="lg"
        readonly
        :value="community.neighbourhood.neighbourhoodUrl"
      >
        <j-button @click.stop="getInviteCode" variant="ghost" slot="end"
          ><j-icon :name="hasCopied ? 'clipboard-check' : 'clipboard'"
        /></j-button>
      </j-input>
    </j-box>
  </j-modal>

  <j-modal
    :open="modals.showCommunitySettings"
    @toggle="(e) => setShowCommunitySettings(e.target.open)"
  >
    <community-settings />
  </j-modal>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";

import EditCommunity from "@/containers/EditCommunity.vue";
import CreateChannel from "@/containers/CreateChannel.vue";
import CommunityMembers from "@/containers/CommunityMembers.vue";
import CommunitySettings from "@/containers/CommunitySettings.vue";

import { CommunityState, ModalsState } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { mapActions } from "pinia";

export default defineComponent({
  name: "CommunityView",
  components: {
    EditCommunity,
    CreateChannel,
    CommunityMembers,
    CommunitySidebar,
    CommunitySettings,
    SidebarLayout,
  },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    return {
      appStore,
      dataStore,
    };
  },
  data() {
    return {
      hasCopied: false,
      channelWorkerLoop: null as null | Worker,
    };
  },
  watch: {
    "$route.params.communityId": {
      handler: function (id: string) {
        if (id != undefined) {
          this.dataStore.fetchNeighbourhoodMembers(id);
          this.dataStore.fetchNeighbourhoodMetadata(id);
        }
        this.handleWorker(id);
        this.handleThemeChange(id);
        this.goToActiveChannel(id);
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
    ]),
    goToActiveChannel(communityId: string) {
      if (!communityId) return;
      const firstChannel = this.dataStore.getChannelStates(communityId)[0].name;
      const currentChannelId =
        this.community.state.currentChannelId || firstChannel;

      if (currentChannelId) {
        this.$router.push({
          name: "channel",
          params: {
            communityId,
            channelId: currentChannelId,
          },
        });
      }
    },
    handleThemeChange(id: string) {
      if (!id) {
        this.appStore.changeCurrentTheme("global");
        return;
      } else {
        this.appStore.changeCurrentTheme(
          this.community.state?.useLocalTheme ? id : "global"
        );
      }
    },
    async handleWorker(id: string): Promise<void> {
      this.channelWorkerLoop?.terminate();

      if (id) {
        const channelLinksWorker =
          await this.dataStore.getNeighbourhoodChannels({
            communityId: id,
          });
        this.channelWorkerLoop = channelLinksWorker;
      }
    },
    getInviteCode() {
      // Get the invite code to join community and copy to clipboard
      const url = this.community.neighbourhood.neighbourhoodUrl;
      const el = document.createElement("textarea");
      el.value = `Hey! Here is an invite code to join my private community on Flux: ${url}`;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      this.hasCopied = true;

      this.appStore.showSuccessToast({
        message: "Your custom invite code is copied to your clipboard!",
      });
    },
  },
  computed: {
    modals(): ModalsState {
      return this.appStore.modals;
    },
    community(): CommunityState {
      const communityId = this.$route.params.communityId as string;
      return this.dataStore.getCommunity(communityId);
    },
  },
});
</script>
