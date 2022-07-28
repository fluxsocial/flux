<template>
  <router-view :key="componentKey" v-if="!ui.showGlobalLoading"></router-view>
  <j-modal
    size="sm"
    :open="modals.showCode"
    @toggle="(e) => setShowCode(e.target.open)"
  >
    <connect-client
      @submit="capabilitiesCreated"
      @cancel="() => setShowCode(false)"
    />
  </j-modal>
  <div class="global-loading" v-if="ui.showGlobalLoading">
    <div class="global-loading__backdrop"></div>
    <div class="global-loading__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-spinner size="lg"> </j-spinner>
        <j-text size="700">Please wait...</j-text>
      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { MainClient } from "./app";
import { defineComponent, ref, watch } from "vue";
import ConnectClient from "@/containers/ConnectClient.vue";
import { mapActions } from "pinia";
import { useAppStore } from "./store/app";
import { ApplicationState, FeedType, ModalsState, NeighbourhoodState } from "@/store/types";
import { useRoute, useRouter } from "vue-router";
import { checkConnection } from "./router";
import { findAd4mPort } from "./utils/findAd4minPort";
import { useDataStore } from "./store/data";
import { LinkExpression } from "@perspect3vism/ad4m";
import { CHANNEL, EXPRESSION, MEMBER } from "./constants/neighbourhoodMeta";
import { useUserStore } from "./store/user";
import retry from "./utils/retry";

export default defineComponent({
  name: "App",
  components: { ConnectClient },

  setup() {
    const appStore = useAppStore();
    const router = useRouter();
    const route = useRoute();
    const componentKey = ref(0);
    const dataStore = useDataStore();
    const userStore = useUserStore();

    return { 
      appStore, 
      componentKey, 
      router,
      route,
      dataStore,
      userStore,
    };
  },

  mounted() {
    this.appStore.setGlobalLoading(true);

    this.checkConnection();
  },

  computed: {
    modals(): ModalsState {
      return this.appStore.modals;
    },
    ui(): ApplicationState {
      return this.appStore.$state;
    },
  },

  methods: {
    ...mapActions(useAppStore, ["setShowCode"]),
    async capabilitiesCreated() {
      this.setShowCode(false);

      this.componentKey += 1;

      this.appStore.setGlobalLoading(true);

      this.checkConnectionReroute();
    },
    async checkConnectionReroute() {
      try {
        const status = await checkConnection();

        if (!status) {
          await findAd4mPort(MainClient.portSearchState === 'found' ? MainClient.port : undefined)
      
          await MainClient.ad4mClient.agent.status();
        }

        const { perspective } = await MainClient.ad4mClient.agent.me();

        const fluxLinksFound = perspective?.links.find(e => e.data.source.startsWith('flux://'));

        if (!fluxLinksFound) {
          await this.router.replace("/signup");
        } else {
          if (['unlock', 'connect', 'signup'].includes(this.router.currentRoute.value.name as string)) {
            await this.router.replace("/home");
          }
        }

        this.startWatcher();

        this.appStore.setGlobalLoading(false);
      } catch (e) {
        console.log('main', {e}, e.message === "signature verification failed");

        if (e.message.startsWith(
        "Capability is not matched, you have capabilities:"
        ) || e.message === 'signature verification failed') {
          if (!this.modals.showCode) {
            MainClient.requestCapability(true).then((val) => {
              if (val) {
                this.setShowCode(true);
              }
            });
          }
        } else if (e.message === "Cannot extractByTags from a ciphered wallet. You must unlock first."
        ) {
          await this.router.replace("/unlock");
          this.appStore.setGlobalLoading(false);
        } else if (e.message === "Couldn't find an open port") {
          await this.router.replace("/connect");
          this.appStore.setGlobalLoading(false);
        } else {
          await this.router.replace('/home');
          this.appStore.setGlobalLoading(false);
        }
      }
    },
    async checkConnection() {
      await this.checkConnectionReroute();

      setInterval(async () => {
        await this.checkConnectionReroute();
      }, 30000);
    },
    async startWatcher() {
      const router = this.router;
      const route = this.route;
      const watching: string[] = [];

      //Watch for incoming signals from holochain - an incoming signal should mean a DM is inbound
      const newLinkHandler = async (
        link: LinkExpression,
        perspective: string
      ) => {
        console.debug("GOT INCOMING MESSAGE SIGNAL", link, perspective);
        if (link.data!.predicate! === EXPRESSION) {
          try {
            const expression = await retry(async () => {
              const exp = await MainClient.ad4mClient.expression.getRaw(link.data.target);
              const expObj = JSON.parse(exp);
              if (exp) {
                return { ...expObj, data: expObj.data };
              } else {
                return null;
              }
            }, {});

            console.debug("FOUND EXPRESSION FOR SIGNAL", expression);

            this.dataStore.showMessageNotification({
              router,
              route,
              perspectiveUuid: perspective,
              authorDid: (expression as any)!.author,
              message: (expression as any).data,
            });

            //Add UI notification on the channel to notify that there is a new message there
            this.dataStore.setHasNewMessages({
              channelId: perspective,
              value: true,
            });
          } catch (e: any) {
            throw new Error(e);
          }
        } else if (link.data!.predicate! === MEMBER) {
          const did = link.data!.target!.split("://")[1];
          console.log("Got new member in signal! Parsed out did: ", did);
          if (did) {
            this.dataStore.setNeighbourhoodMember({
              member: did,
              perspectiveUuid: perspective,
            });
          }
        } else if (
          link.data!.predicate! === CHANNEL &&
          link.author != this.userStore.getUser?.agent.did
        ) {
          console.log("Joining channel via link signal!");

          this.dataStore.addChannel({
            communityId: perspective,
            channel: {
                id: link.data.target,
                name: link.data.target,
                creatorDid: link.author,
                sourcePerspective: perspective,
                hasNewMessages: false,
                createdAt: link.timestamp,
                feedType: FeedType.Signaled,
                notifications: {
                  mute: false,
                },
            },
          });
        }
      };

      watch(
        this.dataStore.neighbourhoods,
        async (newValue: { [perspectiveUuid: string]: NeighbourhoodState }) => {
          for (let [k, v] of Object.entries(newValue)) {
            if (watching.filter((val) => val == k).length == 0) {
              console.log("Starting watcher on perspective", k);
              watching.push(k);
              const perspective = await MainClient.ad4mClient.perspective.byUUID(k);

              if (perspective) {
                perspective.addListener('link-added', (result) => {
                  console.debug(
                    "Got new link with data",
                    result.data,
                    "and channel",
                    v
                  );
                  newLinkHandler(
                    result,
                    v.perspective.uuid
                  );
                });
              }

            }
          }
        },
        { immediate: true, deep: true }
      );

    }
  },
});
</script>

<style scoped>
.global-loading {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
}

.global-loading__backdrop {
  position: absolute;
  left: 0;
  height: 0;
  width: 100%;
  height: 100%;
  background: var(--j-color-white);
  opacity: 0.8;
  backdrop-filter: blur(15px);
}

.global-loading__content {
  position: relative;
}

.global-loading j-spinner {
  --j-spinner-size: 80px;
}
</style>