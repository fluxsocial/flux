<template>
  <chat-view
    :perspective-uuid="channel.neighbourhood.perspective.uuid"
    @agent-click="onAgentClick"
    @perspective-click="onPerspectiveClick"
    @hide-notification-indicator="onHideNotificationIndicator"
    @url-click="onLinkClick"    
  ></chat-view>
  <j-modal
    size="xs"
    v-if="activeProfile"
    :open="showProfile"
    @toggle="(e) => toggleProfile(e.target.open, activeProfile)"
  >
    <Profile
      :did="activeProfile"
      :langAddress="profileLanguage"
      @openCompleteProfile="() => handleProfileClick(activeProfile)"
    />
  </j-modal>
  <j-modal
    size="xs"
    v-if="activeCommunity"
    :open="showJoinCommuinityModal"
    @toggle="(e) => toggleJoinCommunityModal(e.target.open, activeCommunity)"
  >
    <j-box v-if="activeCommunity" p="800">
      <j-flex a="center" direction="column" gap="500">
        <j-text v-if="activeCommunity.name">{{activeCommunity.name}}</j-text>
        <j-text
          v-if="activeCommunity.description"
          variant="heading-sm"
          nomargin
        >
          {{ activeCommunity.description }}
        </j-text>
        <j-button 
          :disabled="isJoiningCommunity"
          :loading="isJoiningCommunity"
          @click="joinCommunity"
          size="lg"
          full
          variant="primary"
          >
          Join Community
        </j-button>
      </j-flex>
    </j-box>
  </j-modal>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ChannelState, CommunityState, ExpressionTypes } from "@/store/types";
import { useDataStore } from "@/store/data";
import { ad4mClient } from "@/app";
import Profile from "@/containers/Profile.vue";
import useEventEmitter from "@/utils/useEventEmitter";

interface MentionTrigger {
  label: string;
  id: string;
  trigger: string;
}

export default defineComponent({
  name: "ChannelView",
  components: {
    Profile,
  },
  setup() {
    const dataStore = useDataStore();
    const memberMentions = ref<MentionTrigger[]>([]);
    const activeProfile = ref<any>({});
    const showProfile = ref(false);
    const activeCommunity = ref<any>({});
    const showJoinCommuinityModal = ref(false);
    const bus = useEventEmitter();
    const isJoiningCommunity = ref(false);

    return {
      dataStore,
      script: null as HTMLElement | null,
      memberMentions,
      activeProfile,
      showProfile,
      bus,
      showJoinCommuinityModal,
      activeCommunity,
      isJoiningCommunity
    };
  },
  async mounted() {
    this.script = document.createElement("script");
    this.script.setAttribute("type", "module");
    this.script.innerHTML = `
      import ChatView from 'file:///home/fayeed/dev/perspective-views/packages/mini-chat-view/dist/main.js';
      if(customElements.get('chat-view') === undefined) 
        customElements.define("chat-view", ChatView);
    `;
    this.script;
    document.body.appendChild(this.script);
  },
  unmounted() {
    document.body.removeChild(this.script as any);
  },
  beforeRouteUpdate(to, from, next) {
    const editor = document.getElementsByTagName("footer")[0];
    (
      editor
        ?.getElementsByTagName("j-flex")[0]
        ?.querySelector("emoji-picker") as any
    )?.database.close();
    next();
  },
  beforeRouteLeave(to, from, next) {
    const editor = document.getElementsByTagName("footer")[0];
    (
      editor
        ?.getElementsByTagName("j-flex")[0]
        ?.querySelector("emoji-picker") as any
    )?.database.close();
    next();
  },
  computed: {
    community(): CommunityState {
      const { communityId } = this.$route.params;
      return this.dataStore.getCommunity(communityId as string);
    },
    channel(): ChannelState {
      const { channelId } = this.$route.params;
      return this.dataStore.getChannel(channelId as string);
    },
    profileLanguage(): string {
      const profileLang =
        this.community.neighbourhood.typedExpressionLanguages.find(
          (t: any) => t.expressionType === ExpressionTypes.ProfileExpression
        );
      return profileLang!.languageAddress;
    },
  },
  methods: {
    onAgentClick({ detail }: any) {
      this.toggleProfile(true, detail.did);
    },
    onPerspectiveClick({ detail }: any) {
      let community = this.dataStore.getCommunities.find(e => e.neighbourhood.neighbourhoodUrl === detail.uuid)

      let channelId = this.dataStore.getChannelByNeighbourhoodUrl(detail.uuid)
        ?.neighbourhood.perspective.uuid;

      if (!community && !channelId) {
        // TODO: show modal  
        this.toggleJoinCommunityModal(true, detail.link)
      } else if (community && community.neighbourhood.perspective.uuid !== this.community.neighbourhood.perspective.uuid) {
        this.$router.push({
          name: "community",
          params: {
            communityId: community.neighbourhood.perspective.uuid,
          },
        });
      } else if (channelId) {
        this.$router.push({
          name: "channel",
          params: {
            channelId: channelId,
            communityId: this.community.neighbourhood.perspective.uuid,
          },
        });
      }
    },
    onLinkClick({ detail }: any) {
      window.api.send("openLinkInBrowser", detail.url);
    },
    onHideNotificationIndicator({ detail }: any) {
      this.dataStore.setHasNewMessages({
        channelId: detail.uuid,
        value: false,
      });
    },
    toggleProfile(open: boolean, did?: any): void {
      if (!open) {
        this.activeProfile = undefined;
      } else {
        this.activeProfile = did;
      }
      this.showProfile = open;
    },
    toggleJoinCommunityModal(open: boolean, community?: any): void {
      if (!open) {
        this.activeCommunity = undefined;
      } else {
        this.activeCommunity = community;
      }
      this.showJoinCommuinityModal = open;
    },
    async handleProfileClick(did: string) {
      this.activeProfile = did;

      const me = await ad4mClient.agent.me();

      if (did === me.did) {
        this.$router.push({ name: "home", params: { did } });
      } else {
        this.$router.push({
          name: "profile",
          params: {
            did,
            communityId: this.community.neighbourhood.perspective.uuid,
          },
        });
      }
    },
    joinCommunity() {
      this.isJoiningCommunity = true;
      this.dataStore
        .joinCommunity({ joiningLink: this.activeCommunity.url })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isJoiningCommunity = false;
          this.showJoinCommuinityModal = false;
        });
    },
  },
});
</script>
