import community from "../../../fixtures/community.json";
import getProfileFixture from "../../../fixtures/updateProfile.json";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/user";
import { useDataStore } from "@/store/data";
import { ad4mClient } from "@/app";
import agentByDIDLinksFixture from "../../../fixtures/agentByDIDLinks.json";

describe("Update Profile", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.expression, "get")
      // @ts-ignore
      .mockResolvedValue(getProfileFixture);

      jest
        .spyOn(ad4mClient.agent, "byDID")
        // @ts-ignore
        .mockImplementation(async (did) => {
          if (did.includes('101')) {
            return {
              perspective: {
                links: []
              }
            }
          }
          return agentByDIDLinksFixture;
        });

    store = createPinia();
    setActivePinia(store);
  });

  test("Update Profile - Success", () => {
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

    const userStore = useUserStore();
    const dataStore = useDataStore();

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(userStore.profile).toBeNull();

    userStore.updateProfile({
      username: "jhon_doe",
    });

    expect(userStore.profile!.username).toBe("jhon_doe");
  });

  test("Update Profile - Failure", async () => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "all")
      // @ts-ignore
      .mockResolvedValue([]);

    const userStore = useUserStore();
    const dataStore = useDataStore();

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(userStore.profile).toBeNull();

    try {
      await userStore.updateProfile({
        username: "jhon_doe",
      });
    } catch (error) {
      console.log('clone', error)
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "No user perspective found"
      );
    }

    expect(userStore.profile!.username).toBe("jhon_doe");
  });
});
