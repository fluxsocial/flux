<template>
  <perspective-view
    :port="port"
    :channel="channel.name"
    :perspective-uuid="channel.sourcePerspective"
    @agent-click="onAgentClick"
    @perspective-click="onPerspectiveClick"
    @hide-notification-indicator="onHideNotificationIndicator"
  ></perspective-view>
  <j-modal
    size="xs"
    v-if="activeProfile"
    :open="showProfile"
    @toggle="(e) => toggleProfile(e.target.open, activeProfile)"
  >
    <Profile
      :did="activeProfile"
      @openCompleteProfile="() => handleProfileClick(activeProfile)"
    />
  </j-modal>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ChannelState, CommunityState, ExpressionTypes } from "@/store/types";
import { useDataStore } from "@/store/data";
import { ad4mClient, MainClient } from "@/app";
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
    const bus = useEventEmitter();

    return {
      dataStore,
      script: null as HTMLElement | null,
      memberMentions,
      activeProfile,
      showProfile,
      bus,
    };
  },
  async mounted() {
    this.script = document.createElement("script");
    this.script.setAttribute("type", "module");
    this.script.innerHTML = `
      import PerspectiveView from 'http://127.0.0.1:3030/dist/main.js';
      if(customElements.get('perspective-view') === undefined) 
        customElements.define("perspective-view", PerspectiveView);
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
    port(): number {
      // TODO: This needs to be reactive, probaly not now as we using a normal class
      return MainClient.port;
    },
    community(): CommunityState {
      const { communityId } = this.$route.params;
      return this.dataStore.getCommunity(communityId as string);
    },
    channel(): ChannelState {
      const { channelId, communityId } = this.$route.params;
      return this.dataStore.getChannel(communityId as string, channelId as string)!;
    },
  },
  methods: {
    onAgentClick({ detail }: any) {
      this.toggleProfile(true, detail.did);
    },
    onPerspectiveClick({ detail }: any) {
      let channelId = Object.values(this.dataStore.channels).find(
        (channel) => channel.sourcePerspective === this.community.neighbourhood.perspective.uuid && detail.uuid === channel.name
      )?.id;
      

      if (channelId) {
        this.$router.push({
          name: "channel",
          params: {
            channelId,
            communityId: this.community.neighbourhood.perspective.uuid,
          },
        });
      }
    },
    onHideNotificationIndicator({ detail }: any) {
      const { channelId } = this.$route.params;
      console.log("hide notification indicator", detail);
      this.dataStore.setHasNewMessages({
        communityId: this.community.neighbourhood.perspective.uuid,
        channelId: channelId as string,
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
  },
});
</script>
