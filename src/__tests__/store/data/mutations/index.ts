import community from "../../../fixtures/community.json";
import createCommunity from "../../../fixtures/createCommunity.json";
import channel from "../../../fixtures/channel.json";
import channel1 from "../../../fixtures/channel1.json";
import createChannel from "../../../fixtures/createChannel.json";
import messageLink from "../../../fixtures/messageLink.json";
import messageExpression from "../../../fixtures/messageExpression.json";
import { useDataStore } from "@/store/data";
import { Pinia, createPinia, setActivePinia } from "pinia";

describe("Data Mutations", () => {
  let store: Pinia;

  beforeEach(() => {
    store = createPinia();
    setActivePinia(store);
  });

  test("Add Community", () => {
    const dataStore = useDataStore();
    expect(Object.values(dataStore.communities).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.values(dataStore.communities).length).toBe(1);

    expect(
      (Object.values(dataStore.neighbourhoods)[0] as any).perspective.uuid
    ).toBe(community.neighbourhood.perspective.uuid);
  });

  test("Check duplicate community if one exists already", async () => {
    const dataStore = useDataStore();
    expect(Object.values(dataStore.communities).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.keys(dataStore.communities)).toStrictEqual([
      community.neighbourhood.perspective.uuid,
    ]);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.keys(dataStore.communities)).toStrictEqual([
      community.neighbourhood.perspective.uuid,
    ]);
  });

  test("Set current channel Id", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.communities[community.state.perspectiveUuid].currentChannelId
    ).toBeNull();

    dataStore.setCurrentChannelId({
      communityId: community.state.perspectiveUuid,
      channelId: createChannel.sourcePerspective,
    });

    expect(
      dataStore.communities[community.state.perspectiveUuid].currentChannelId
    ).toBe(createChannel.sourcePerspective);
  });

  test("Remove community", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(Object.values(dataStore.communities).length).toBe(1);
    expect(Object.values(dataStore.channels).length).toBe(1);

    dataStore.removeCommunity({communityId: community.state.perspectiveUuid});

    expect(Object.values(dataStore.communities).length).toBe(0);
    expect(Object.values(dataStore.neighbourhoods).length).toBe(0);
  });

  test("Set Channel Notification State", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.channels[createChannel.id].notifications.mute
    ).toBeFalsy();

    dataStore.setChannelNotificationState({
      channelId: createChannel.id,
    });

    expect(
      dataStore.channels[createChannel.id].notifications.mute
    ).toBeTruthy();
  });

  test("Set community Theme", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      fontSize: "md",
      fontFamily: "Poppins",
      name: "light",
      hue: 270,
      saturation: 60,
    });

    dataStore.setCommunityTheme({
      communityId: community.state.perspectiveUuid,
      // @ts-ignore
      theme: {
        fontSize: "lg",
        saturation: 80,
      },
    });

    expect(
      dataStore.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      fontSize: "lg",
      fontFamily: "Poppins",
      name: "light",
      hue: 270,
      saturation: 80,
    });
  });

  test("Update Community Metadata", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "test"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("");
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid]
        .groupExpressionRef
    ).toBe(
      "QmUCLri8MRJVpXsBRvry8KaQEkX7RhKcqBwfAkMmTo6Swq://842924ebd45599a4c749d87247368bed49c9d0b2b3716573f054b472b6a5b2a52eb97ab243d9ee"
    );

    // @ts-ignore
    dataStore.updateCommunityMetadata({
      communityId: community.state.perspectiveUuid,
      name: "test1",
      description: "test",
      groupExpressionRef:
        "QmUCLri8MRJVpXsBRvry8KaQEkX7RhKcqBwfAkMmTo6Swq://842924ebd45599a4c749d87247368bed49c9d0b2b3716573f054b472b6a5b2a52eb97ab243d9e1",
    });

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "test1"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("test");
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid]
        .groupExpressionRef
    ).toBe(
      "QmUCLri8MRJVpXsBRvry8KaQEkX7RhKcqBwfAkMmTo6Swq://842924ebd45599a4c749d87247368bed49c9d0b2b3716573f054b472b6a5b2a52eb97ab243d9e1"
    );
  });

  test("Set channel scrollTop", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.channels[createChannel.id].scrollTop
    ).toBeUndefined();

    dataStore.setChannelScrollTop({
      channelId: createChannel.id,
      value: 100,
    });

    expect(
      dataStore.channels[createChannel.id].scrollTop
    ).toBe(100);
  });

  test("Add channel", () => {
    const dataStore = useDataStore();
    expect(Object.values(dataStore.communities).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.values(dataStore.communities).length).toBe(1);

    expect(
      dataStore.neighbourhoods[community.neighbourhood.perspective.uuid]
        .linkedPerspectives.length
    ).toBe(1);

    dataStore.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      // @ts-ignore
      channel,
    });
  });

  test("Add channel to without adding an entry in community neighbourhood", () => {
    const dataStore = useDataStore();
    expect(Object.values(dataStore.neighbourhoods).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(Object.values(dataStore.channels).length).toBe(1);

    expect(Object.keys(dataStore.channels)).toStrictEqual([
      createChannel.name,
    ]);
  });

  test("Set has new messages", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(createCommunity);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.channels[createChannel.id].hasNewMessages
    ).toBeFalsy();

    dataStore.setHasNewMessages({
      communityId: createCommunity.state.perspectiveUuid,
      channelId: createChannel.id,
      value: true,
    });

    expect(
      dataStore.channels[createChannel.id].hasNewMessages
    ).toBeTruthy();
  });
});
