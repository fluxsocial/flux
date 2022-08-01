import initAgentFixture from "../../../fixtures/initAgent.json";
import addPerspectiveFixture from "../../../fixtures/addPerspective.json";
import { AgentStatus, PerspectiveHandle } from "@perspect3vism/ad4m";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/user";
import { ad4mClient } from "@/app";
import agentByDIDLinksFixture from "../../../fixtures/agentByDIDLinks.json";
import { HAS_BG_IMAGE, HAS_PROFILE_IMAGE, HAS_THUMBNAIL_IMAGE, HAS_USERNAME } from "@/constants/profile";

describe("Store Actions", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.agent, "generate")
      .mockImplementation(async (password) => {
        if (password) {
          return initAgentFixture as AgentStatus;
        } else {
          throw Error("No Password passed");
        }
      });

    jest
      .spyOn(ad4mClient.agent, "status")
      // @ts-ignore
      .mockReturnValue(initAgentFixture);

    jest
      .spyOn(ad4mClient.agent, "updatePublicPerspective")
      // @ts-ignore
      .mockReturnValue(true);

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "add")
      // @ts-ignore
      .mockResolvedValue(addPerspectiveFixture as PerspectiveHandle);

    // @ts-ignore
    jest
     .spyOn(ad4mClient.perspective, "snapshotByUUID")
     // @ts-ignore
     .mockResolvedValue({links: []});

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "all")
      // @ts-ignore
      .mockResolvedValue([{
        name: "Flux Agent Profile Data",
        // @ts-ignore
        neighbourhood: null,
        // @ts-ignore
        sharedUrl: null,
        uuid: "2a912c2c-6d30-46f2-b451-880349fced08"
      }]);
  

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "addLink")
      // @ts-ignore
      .mockImplementation((_, link) => {
        if (link.predicate === HAS_USERNAME) {
          return agentByDIDLinksFixture.perspective.links[0]
        } else if (link.predicate === HAS_BG_IMAGE) {
          return agentByDIDLinksFixture.perspective.links[1]
        } else if (link.predicate === HAS_PROFILE_IMAGE) {
          return agentByDIDLinksFixture.perspective.links[2]
        } else if (link.predicate === HAS_THUMBNAIL_IMAGE) {
          return agentByDIDLinksFixture.perspective.links[4]
        }
      });

        
    // @ts-ignore
    jest
      .spyOn(ad4mClient.expression, "create")
      // @ts-ignore
      .mockResolvedValue("lang://exp");

    store = createPinia();
    setActivePinia(store);
  });

  test("Create User with all the property", async () => {
    const userStore = useUserStore();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.did).toBe("");
    expect(userStore.profile).toBeNull();

    const profile = {
      givenName: "",
      familyName: "",
      email: "",
      username: "jhon",
      bio: "",
      profilePicture: "",
      thumbnailPicture: undefined,
    };

    await userStore.createUser({
      ...profile,
    });

    expect(userStore.agent.isInitialized).toBeTruthy();
    expect(userStore.agent.isInitialized).toBeTruthy();
    expect(userStore.agent.did).toBe(initAgentFixture.did);
    expect(userStore.profile).not.toBeNull();
    expect(userStore.profile).toStrictEqual(profile);
  });
});
