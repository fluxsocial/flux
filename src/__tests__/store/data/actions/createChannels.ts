import community from "../../../fixtures/community.json";
import addChannelPerspective from "../../../fixtures/addChannelPerspective.json";
import addChannelUniqueHolochainLanguages from "../../../fixtures/addChannelUniqueHolochainLanguages.json";
import addChannelCreateLinkType from "../../../fixtures/addChannelCreateLinkType.json";
import addChannelCreateLink from "../../../fixtures/addChannelCreateLink.json";
import createChannelMeta from "../../../fixtures/createChannelMeta.json";
import * as createNeighbourhoodMeta from "@/core/methods/createNeighbourhoodMeta";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useDataStore } from "@/store/data";
import { ad4mClient } from "@/app";
import agentByDIDLinksFixture from "../../../fixtures/agentByDIDLinks.json";

describe("Create Channel", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "add")
      // @ts-ignore
      .mockResolvedValue(addChannelPerspective);

    // @ts-ignore
    jest
      .spyOn(ad4mClient.languages, "applyTemplateAndPublish")
      .mockImplementation(async () => {
        return addChannelUniqueHolochainLanguages;
      });

    // @ts-ignore
    jest
      .spyOn(ad4mClient.neighbourhood, "publishFromPerspective")
      .mockImplementation(async () => {
        return "neighbourhood://8421244696ef9042d51add6f4517ae9353d7a4374459f3f50d3bf6f324219e3a62ebd46ec1b688";
      });

    // @ts-ignore
    jest
      .spyOn(createNeighbourhoodMeta, "createNeighbourhoodMeta")
      .mockImplementation(async (name, desc, lang) => {
        return [{...createChannelMeta, hash: () => 12345}];
      });

    jest
      .spyOn(ad4mClient.agent, "me")
      // @ts-ignore
      .mockImplementation(async (did) => {
        return agentByDIDLinksFixture;
      });

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "addLink")
      .mockImplementation(async (perspective, link) => {
        if (link.predicate === "rdf://type") {
          return {...addChannelCreateLinkType, hash: () => 12345};
        }
        return {...addChannelCreateLink, hash: () => 12345};
      });

    store = createPinia();

    setActivePinia(store);
  });

  test("Create channel for community that doesnt exist", async () => {
    const dataStore = useDataStore();

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);

    try {
      await dataStore.createChannel({
        communityId: community.state.perspectiveUuid,
        name: "test",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error: Community does not exists"
      );
    }

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);
  });

  test("Create channel for a community", async () => {
    const dataStore = useDataStore();

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.keys(dataStore.neighbourhoods).length).toBe(1);

    const channel = await dataStore.createChannel({
      communityId: community.state.perspectiveUuid,
      name: "test",
    });

    expect(Object.keys(dataStore.channels).length).toBe(1);

    expect(
      Object.keys(dataStore.channels).find(
        (e) => e === channel.id
      )
    ).toBe(channel.id);
  });
});
