import { ad4mClient, MainClient } from "@/app";
import { CHANNEL, SELF } from "@/constants/neighbourhoodMeta";
import { getMetaFromNeighbourhood } from "@/core/methods/getMetaFromNeighbourhood";
import { Ad4mClient, LinkExpression, LinkQuery, PerspectiveProxy } from "@perspect3vism/ad4m";
import { nanoid } from "nanoid";
import { useDataStore } from ".";
import { CommunityState, ExpressionTypes, FeedType, MembraneType } from "../types";

export function getMetaFromLinks(links: LinkExpression[]) {
  const langs = links.map((link) => MainClient.ad4mClient.languages.meta(link.data.target));
  return Promise.all(langs);
}

export async function buildCommunity(perspective: PerspectiveProxy) {
  const meta = getMetaFromNeighbourhood(perspective.neighbourhood?.meta?.links!);

  const metaLangs = perspective.neighbourhood?.meta?.links!.filter((link: any) => link.data.predicate === "language");

  const typeLangs = await getMetaFromLinks(metaLangs!);

  const typedExpressionLanguages = typeLangs!.map((link: any) => ({
    languageAddress: link.address,
    expressionType: link.name.endsWith('shortform-expression') ? ExpressionTypes.ShortForm : ExpressionTypes.GroupExpression,
  }));

  return {
    neighbourhood: {
      name: perspective.name,
      creatorDid: meta.creatorDid,
      description: meta.description,
      image: "",
      thumbnail: "",
      perspective: {
        uuid: perspective.uuid,
        name: perspective.name,
        sharedUrl: perspective.sharedUrl,
        neighbourhood: perspective.neighbourhood,
      },
      typedExpressionLanguages,
      groupExpressionRef: typedExpressionLanguages.find((lang: any) => lang.expressionType === ExpressionTypes.GroupExpression)?.languageAddress,
      neighbourhoodUrl: perspective.sharedUrl,
      membraneType: MembraneType.Unique,
      linkedPerspectives: [perspective.uuid],
      linkedNeighbourhoods: [perspective.uuid],
      members: [meta.creatorDid],
      membraneRoot: perspective.uuid,
      currentExpressionLinks: {},
      currentExpressionMessages: {},
      createdAt: new Date().toISOString(),
    },
    state: {
      perspectiveUuid: perspective.uuid,
      theme: {
        fontSize: "md",
        fontFamily: "Poppins",
        name: "light",
        hue: 270,
        saturation: 60,
      },
      useLocalTheme: false,
      currentChannelId: null,
      hideMutedChannels: false,
      notifications: {
        mute: false,
      },
    },
  } as CommunityState;
}

export async function hydrateState() {
  const client = MainClient.ad4mClient;
  const dataStore = useDataStore();
  const perspectives = await client.perspective.all();

  for (const perspective of perspectives) {
    const links = await client.perspective.queryLinks(perspective.uuid, new LinkQuery({
      source: perspective.sharedUrl, // TODO: change this to self
      predicate: CHANNEL
    }));

    if (links.length > 0) {
      if (perspective.sharedUrl !== undefined) {
        const newCommunity = await buildCommunity(perspective);

        dataStore.addCommunity(newCommunity);

        dataStore.clearChannels({communityId: perspective.uuid});

        for (const link of links) {
          dataStore.addChannel({
            communityId: perspective.uuid,
            channel: {
                id: nanoid(),
                name: link.data.target,
                creatorDid: link.author,
                sourcePerspective: perspective.uuid,
                hasNewMessages: false,
                createdAt: new Date().toISOString(),
                feedType: FeedType.Signaled,
                notifications: {
                  mute: false,
                },
            },
          });
        }
      }
    }
  }
}