import { computed, ref, watch } from "vue";
import { Agent } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { mapLiteralLinks } from "@coasys/flux-utils";
import { profile } from "@coasys/flux-constants";
import { Profile } from "@coasys/flux-types";

const {
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} = profile;

export function useAgent(client: AgentClient, did: string | Function) {
  const agent = ref<Agent | null>(null);
  const didRef = typeof did === "function" ? (did as any) : ref(did);

  watch(
    [client, didRef],
    async ([c, d]) => {
      if (d) {
        agent.value = await client.byDID(d);
      }
    },
    { immediate: true }
  );

  const profile = computed<Profile | null>(() => {
    if (agent.value?.perspective) {
      const perspective = agent.value.perspective;
      const prof = mapLiteralLinks(
        perspective.links.filter((e) => e.data.source === FLUX_PROFILE),
        {
          username: HAS_USERNAME,
          bio: HAS_BIO,
          givenName: HAS_GIVEN_NAME,
          email: HAS_EMAIL,
          familyName: HAS_FAMILY_NAME,
          profilePicture: HAS_PROFILE_IMAGE,
          profileThumbnailPicture: HAS_THUMBNAIL_IMAGE,
          profileBackground: HAS_BG_IMAGE,
        }
      );
      return { ...prof, did: didRef.value } as Profile;
    } else {
      return null;
    }
  });

  return { agent, profile };
}
