import { v4 as uuidv4 } from "uuid";
import {
  SOCIAL_CONTEXT_OFFICIAL,
  GROUP_EXPRESSION_OFFICIAL
} from "@/constants/languages";

import { MEMBER } from "@/constants/neighbourhoodMeta";

import {
  MembraneType,
  FluxExpressionReference,
  ExpressionTypes,
  CommunityState,
  FeedType,
} from "@/store/types";
import { Perspective, PerspectiveHandle } from "@perspect3vism/ad4m";
import { createNeighbourhoodMeta } from "@/core/methods/createNeighbourhoodMeta";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { ad4mClient, MainClient } from "@/app";

export interface Payload {
  perspectiveName: string;
  image?: string;
  thumbnail?: string;
  description: string;
}

export default async ({
  perspectiveName,
  description,
  thumbnail = "",
  image = "",
}: Payload): Promise<CommunityState> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    const agent = await ad4mClient.agent.me()

    const creatorDid = agent.did;

    const createSourcePerspective = (await ad4mClient.perspective.add(
      perspectiveName
    )) as PerspectiveHandle;
    console.log("Created source perspective", createSourcePerspective);

    //Get the variables that we need to create new unique languages
    const uid = uuidv4().toString();

    //Create unique social-context
    const socialContextLang =
      await ad4mClient.languages.applyTemplateAndPublish(
        SOCIAL_CONTEXT_OFFICIAL,
        JSON.stringify({
          uid: uid,
          name: `${perspectiveName}-social-context`,
        })
      );
    console.log("Response from create social-context", socialContextLang);
    //Create group expression language
    const groupExpressionLang =
      await ad4mClient.languages.applyTemplateAndPublish(
        GROUP_EXPRESSION_OFFICIAL,
        JSON.stringify({
          uid: uid,
          name: `${perspectiveName}-group-expression`,
        })
      );
    console.log("Response from create group exp lang", groupExpressionLang);
    //Get language after templating to install it
    ad4mClient.languages.byAddress(groupExpressionLang.address);
    const typedExpLangs = [
      {
        languageAddress: groupExpressionLang.address!,
        expressionType: ExpressionTypes.GroupExpression,
      } as FluxExpressionReference,
    ];

    //Publish perspective
    const metaLinks = await createNeighbourhoodMeta(
      perspectiveName,
      description,
      creatorDid,
      typedExpLangs
    );
    const meta = new Perspective(metaLinks);
    const neighbourhood = await ad4mClient.neighbourhood.publishFromPerspective(
      createSourcePerspective.uuid,
      socialContextLang.address,
      meta
    );
    console.log("Created neighbourhood with result", neighbourhood);

    //await sleep(10000);

    //Create link denoting type of community
    const addLink = await ad4mClient.perspective.addLink(
      createSourcePerspective.uuid!,
      {
        source: neighbourhood,
        target: "sioc://community",
        predicate: "rdf://type",
      }
    );
    console.log("Added typelink with response", addLink);

    //Create the group expression
    const createExp = await ad4mClient.expression.create(
      {
        name: perspectiveName,
        description: description,
        image: image,
        thumbnail: thumbnail,
      },
      groupExpressionLang.address!
    );
    console.log("Created group expression with response", createExp);

    //Create link between perspective and group expression
    const addGroupExpLink = await ad4mClient.perspective.addLink(
      createSourcePerspective.uuid!,
      {
        source: neighbourhood,
        target: createExp,
        predicate: "rdf://class",
      }
    );
    console.log(
      "Created group expression link",
      addGroupExpLink,
      userStore.getProfile
    );

    //Create link between perspective and group expression
    const addProfileLink = await ad4mClient.perspective.addLink(
      createSourcePerspective.uuid!,
      {
        source: neighbourhood,
        target: creatorDid,
        predicate: MEMBER,
      }
    );
    console.log("Created profile expression link", addProfileLink);


    const newCommunity = {
      neighbourhood: {
        name: perspectiveName,
        creatorDid: creatorDid,
        description: description,
        image: image,
        thumbnail: thumbnail,
        perspective: {
          uuid: createSourcePerspective.uuid,
          name: createSourcePerspective.name,
          sharedUrl: neighbourhood,
          neighbourhood: createSourcePerspective.neighbourhood,
        },
        typedExpressionLanguages: typedExpLangs,
        groupExpressionRef: createExp,
        neighbourhoodUrl: neighbourhood,
        membraneType: MembraneType.Unique,
        linkedPerspectives: [createSourcePerspective.uuid],
        linkedNeighbourhoods: [createSourcePerspective.uuid],
        members: [creatorDid],
        membraneRoot: createSourcePerspective.uuid,
        currentExpressionLinks: {},
        currentExpressionMessages: {},
        createdAt: new Date().toISOString(),
      },
      state: {
        perspectiveUuid: createSourcePerspective.uuid,
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

    dataStore.addCommunity(newCommunity);
    // We add a default channel that is a reference to
    // the community itself. This way we can utilize the fractal nature of
    // neighbourhoods. Remember that this also need to happen in join community.
    await dataStore.createChannel({
      name: "Home",
      communityId: createSourcePerspective.uuid
    });

    // @ts-ignore
    return newCommunity;
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
