<template>
  <div class="profile__container">
    <div
      :style="{ backgroundImage: `url(${profilebg})` }"
      class="profile__bg"
    />

    <div v-if="profile" class="profile">
      <j-flex a="start" direction="column" gap="500">
        <div class="profile__avatar">
          <j-avatar
            class="avatar"
            :hash="$route.params.did"
            :src="profile.profilePicture"
          />
          <j-button
            v-if="sameAgent"
            variant="subtle"
            @click="() => setShowEditProfile(true)"
          >
            Edit Profile
          </j-button>
        </div>
      </j-flex>
      <div class="content">
        <div>
          <div class="profile-info">
            <j-box pb="300">
              <j-text
                v-if="profile.familyName || profile.givenName"
                variant="heading-sm"
              >
                {{ `${profile.givenName} ${profile.familyName}` }}
              </j-text>
              <j-text nomargin size="500" weight="500" color="ui-700">
                @{{ profile.username }}
              </j-text>
            </j-box>
            <j-box>
              <j-text nomargin size="500" color="black" v-if="profile.bio">
                {{ profile.bio }}</j-text
              >
              <j-text nomargin size="500" color="black" v-else>
                No bio yet</j-text
              >
            </j-box>
          </div>
        </div>

        <div class="grid">
          <ProfileCard
            v-for="link in profileLinks"
            :key="link.id"
            :title="link.has_name"
            :description="link.has_description"
            :image="link.has_image"
            :sameAgent="sameAgent"
            @click="() => onLinkClick(link)"
            @delete="() => deleteLinks(link.id)"
            @edit="() => setEditLinkModal(true, link)"
          />
          <div
            class="add"
            @click="() => (showAddlinkModal = true)"
            v-if="sameAgent"
          >
            <j-icon name="plus" size="xl"></j-icon>
            <j-text>Add Link</j-text>
          </div>
        </div>
      </div>
    </div>

    <div
      class="back"
      @click="() => $router.back()"
      v-if="$route.name !== 'home'"
    >
      <j-icon name="arrow-left" size="lg"></j-icon>
    </div>
  </div>
  <j-modal
    size="lg"
    :open="showAddlinkModal"
    @toggle="(e) => setAddLinkModal(e.target.open)"
  >
    <ProfileAddLink
      v-if="showAddlinkModal"
      @submit="() => setAddLinkModal(false)"
      @cancel="() => setAddLinkModal(false)"
    ></ProfileAddLink>
  </j-modal>
  <j-modal
    size="lg"
    :open="showEditlinkModal"
    @toggle="(e) => setEditLinkModal(e.target.open, editArea)"
  >
    <ProfileEditLink
      v-if="showEditlinkModal"
      @submit="() => setEditLinkModal(false, editArea)"
      @cancel="() => setEditLinkModal(false, editArea)"
      :area="editArea"
    ></ProfileEditLink>
  </j-modal>
  <j-modal
    size="lg"
    :open="showJoinCommunityModal"
    @toggle="(e) => setShowJoinCommunityModal(e.target.open)"
  >
    <ProfileJoinLink
      @submit="() => setShowJoinCommunityModal(false)"
      @cancel="() => setShowJoinCommunityModal(false)"
      :joiningLink="joiningLink"
    ></ProfileJoinLink>
  </j-modal>
  <j-modal
    :open="modals.showEditProfile"
    @toggle="(e) => setShowEditProfile(e.target.open)"
  >
    <edit-profile
      @submit="() => setShowEditProfile(false)"
      @cancel="() => setShowEditProfile(false)"
      :bg="profilebg"
      :preBio="profile?.bio || ''"
    />
  </j-modal>
  <router-view></router-view>
</template>

<script lang="ts">
import { ad4mClient } from "@/app";
import { useDataStore } from "@/store/data";
import { ExpressionTypes, ModalsState, Profile, ProfileWithDID } from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import { Link, LinkExpression, PerspectiveInput } from "@perspect3vism/ad4m";
import { defineComponent } from "vue";
import ProfileCard from "./ProfileCards.vue";
import ProfileAddLink from "./ProfileAddLink.vue";
import ProfileEditLink from "./ProfileEditLink.vue";
import ProfileJoinLink from "./ProfileJoinLink.vue";
import { useUserStore } from "@/store/user";
import EditProfile from "@/containers/EditProfile.vue";
import { useAppStore } from "@/store/app";
import { mapActions } from "pinia";
import getAgentLinks from "@/utils/getAgentLinks";
import { FLUX_PROFILE } from "@/constants/profile";

export default defineComponent({
  name: "ProfileView",
  components: {
    ProfileCard,
    ProfileAddLink,
    ProfileEditLink,
    ProfileJoinLink,
    EditProfile,
  },
  setup() {
    const appStore = useAppStore();

    return {
      appStore,
    };
  },
  data() {
    return {
      profile: {} as ProfileWithDID | null,
      showAddlinkModal: false,
      showEditlinkModal: false,
      showJoinCommunityModal: false,
      profileLinks: [] as any[],
      profilebg: "",
      joiningLink: "",
      sameAgent: false,
      editArea: null as any,
    };
  },
  methods: {
    setAddLinkModal(value: boolean): void {
      this.showAddlinkModal = value;
    },
    setEditLinkModal(value: boolean, area: any): void {
      this.showEditlinkModal = value;
      this.editArea = area;
    },
    setShowJoinCommunityModal(value: boolean): void {
      this.showJoinCommunityModal = value;
    },
    async getAgentAreas() {
      const did = this.$route.params.did as string;
      const me = await ad4mClient.agent.me();
      const userStore = useUserStore();
      const userPerspective = userStore.getAgentProfileProxyPerspectiveId;

      const links = (await getAgentLinks(
        did || me.did,
        did === me.did || did === undefined ? userPerspective! : undefined
      )).filter(e => e.data.source.startsWith('flux://'));

      const preArea: { [x: string]: any } = {};

      for (const e of links) {
        const predicate = e.data.predicate.split("://")[1];
        if (!preArea[e.data.source]) {
          preArea[e.data.source] = {
            id: e.data.source,
          };
        }

        if (predicate === "has_post") {
          preArea[e.data.source][predicate] = e.data.target.replace(
            "text://",
            ""
          );
        } else if (predicate === "has_images") {
          try {
            const expUrl = e.data.target;
            console.log("expUrl", expUrl);
            const image = await ad4mClient.expression.get(expUrl);
            console.log("image", image);
            if (image) {
              if (!preArea[e.data.source][predicate]) {
                preArea[e.data.source][predicate] = [];
                preArea[e.data.source]["has_image"] = image.data.slice(1, -1);
              }

              preArea[e.data.source][predicate].push(image.data.slice(1, -1));
            }
          } catch (e) {
            console.log("Error encountered while parsing images", e);
          }
        } else {
          preArea[e.data.source][predicate] = e.data.target.split("://")[1];
        }
      }

      this.profileLinks = Object.values(preArea).filter(
        (e) => e.id !== FLUX_PROFILE
      );

      console.log('links', links)
    },
    async getAgentProfile() {
      const did = this.$route.params.did as string;
      const me = await ad4mClient.agent.me();

      this.profile = await getProfile(did || me.did);

      console.log("profile", this.profileLinks, this.profile);
    },
    onLinkClick(link: any) {
      const dataStore = useDataStore();

      if (link.area_type === "community") {
        const community = dataStore.getCommunities.find(
          (e) => e.neighbourhood.neighbourhoodUrl === link.has_post
        );
        console.log(
          community,
          this.showJoinCommunityModal,
          this.showAddlinkModal
        );

        if (community) {
          this.$router.push({
            name: "community",
            params: { communityId: community?.neighbourhood.perspective.uuid },
          });
        } else {
          this.showJoinCommunityModal = true;
          this.joiningLink = link.has_post;
        }
      } else if (link.area_type === "webLink") {
        window.api.send("openLinkInBrowser", link.has_post);
      } else if (link.area_type === "simpleArea") {
        this.$router.push({
          name: "profile-feed",
          params: link,
        });
      }
    },
    async deleteLinks(areaName: string) {
      const userStore = useUserStore();
      const me = await ad4mClient.agent.me();
      const userPerspective = userStore.getAgentProfileProxyPerspectiveId;
      const links = await getAgentLinks(me.did, userPerspective!);

      const newLinks = [];

      for (const link of links) {
        const newLink = JSON.parse(JSON.stringify(link));
        newLink.__typename = undefined;
        newLink.data.__typename = undefined;
        newLink.proof.__typename = undefined;

        if (link.data.source === areaName || link.data.target === areaName) {
          console.log(link);
          await ad4mClient.perspective.removeLink(userPerspective!, newLink);
        } else {
          newLinks.push(newLink);
        }
      }

      this.profileLinks = this.profileLinks.filter((e) => e.id !== areaName);

      await ad4mClient.agent.updatePublicPerspective({
        links: newLinks,
      } as PerspectiveInput);
    },
    ...mapActions(useAppStore, ["setShowEditProfile"]),
  },
  async mounted() {
    this.getAgentProfile();
    this.getAgentAreas();
    const did = this.$route.params.did as string;
    const me = await ad4mClient.agent.me();

    this.sameAgent = did === me.did;
    if (did === undefined) {
      this.sameAgent = true;
    }
  },
  watch: {
    showAddlinkModal() {
      if (!this.showAddlinkModal) {
        this.getAgentProfile();
        this.getAgentAreas();
      }
    },
    showEditlinkModal() {
      if (!this.showEditlinkModal) {
        this.getAgentProfile();
        this.getAgentAreas();
      }
    },
    "modals.showEditProfile"() {
      if (!this.modals.showEditProfile) {
        this.getAgentProfile();
        this.getAgentAreas();
      }
    },
    "$route.path"() {
      this.getAgentProfile();
      this.getAgentAreas();
    },
  },
  computed: {
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
});
</script>

<style lang="css" scoped>
.profile__container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
}
.profile__bg {
  height: clamp(150px, 200px, 250px);
  width: 100%;
  background-color: var(--j-color-ui-100);
  background-repeat: no-repeat;
  background-size: cover;
}

.profile__avatar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: 100%;
  margin-top: -40px;
}

.profile-info {
  padding: var(--j-space-500);
}

.content {
  display: grid;
  padding-top: var(--j-space-800);
  grid-template-columns: 2fr 5fr;
  gap: var(--j-space-500);
}

.avatar {
  display: block;
  border-radius: 50%;
  background: white;
  padding: 3px;
  height: 130px;
  width: 130px;
  --j-avatar-size: 100%;
  --j-avatar-border: none;
}

.add {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--j-color-ui-100);
  border-radius: 4px;
  cursor: pointer;
  margin-right: 20px;
  margin-bottom: 20px;
}

.add:hover {
  background: var(--j-color-ui-50);
}

.grid {
  display: grid;
  gap: var(--j-space-400);
  grid-template-columns: 1fr;
}

.profile {
  width: 100%;
  max-width: 1000px;
  margin: auto;
  padding-left: var(--j-space-500);
  padding-right: var(--j-space-500);
}

.back {
  position: absolute;
  top: 20px;
  left: 20px;
  cursor: pointer;
}
</style>
