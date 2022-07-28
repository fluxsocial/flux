import { ad4mClient } from "@/app";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import { FLUX_PROFILE, HAS_EMAIL, HAS_FAMILY_NAME, HAS_GIVEN_NAME, HAS_PROFILE_IMAGE, HAS_THUMBNAIL_IMAGE, HAS_USERNAME } from "@/constants/profile";

import { useAppStore } from "@/store/app";
import getAgentLinks from "@/utils/getAgentLinks";
import { resizeImage, dataURItoBlob, blobToDataURL } from "@/utils/profileHelpers";
import removeTypeName from "@/utils/removeTypeName";
import { Link, LinkExpression, PerspectiveInput } from "@perspect3vism/ad4m";
import { useUserStore } from "..";

export interface Payload {
  givenName: string;
  familyName: string;
  username: string;
  email: string;
  profilePicture?: string;
  thumbnailPicture?: string;
}

export default async ({
  givenName = "",
  familyName = "",
  email = "",
  username,
  profilePicture
}: Payload): Promise<void> => {
  const appStore = useAppStore();
  const userStore = useUserStore();

  try {
    const resizedImage = profilePicture
      ? await resizeImage(dataURItoBlob(profilePicture as string), 100)
      : undefined;
    
    const thumbnail = profilePicture
      ? await blobToDataURL(resizedImage!)
      : undefined;

    const perspectives = await ad4mClient.perspective.all();
    let userPerspective = perspectives.find(e => e.name === "Flux Agent Profile Data");
    let currentLinks = [] as LinkExpression[];
    if (userPerspective) {
      currentLinks = await getAgentLinks(userStore.agent.did!, userPerspective?.uuid);
    } else {
      userPerspective = await ad4mClient.perspective.add("Flux Agent Profile Data");
    };
    const tempLinks = [...currentLinks];
    
    if (profilePicture) {
      const thumbnailImage = await ad4mClient.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileImage = await ad4mClient.expression.create(
        profilePicture,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileImageLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: profileImage,
          predicate: HAS_PROFILE_IMAGE,
        })
      );
  
      const thumbnailImageLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: thumbnailImage,
          predicate: HAS_THUMBNAIL_IMAGE,
        })
      );

      tempLinks.push(profileImageLink, thumbnailImageLink);
    }

    if (givenName) {
      const givenNameLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: givenName,
          predicate: HAS_GIVEN_NAME,
        })
      );

      tempLinks.push(givenNameLink);
    }

    if (familyName) {
      const familyNameLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: familyName,
          predicate: HAS_FAMILY_NAME,
        })
      );

      tempLinks.push(familyNameLink);
    }

    if (email) {
      const emailLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: email,
          predicate: HAS_EMAIL,
        })
      );

      tempLinks.push(emailLink);
    }

    if (username) {
      const userNameLink = await ad4mClient.perspective.addLink(
        userPerspective!.uuid,
        new Link({
          source: FLUX_PROFILE,
          target: username,
          predicate: HAS_USERNAME,
        })
      );

      tempLinks.push(userNameLink);
    }

    const links = [];
    for (const link of tempLinks) {
      links.push(removeTypeName(link));
    }

    await ad4mClient.agent.updatePublicPerspective({
      links,
    } as PerspectiveInput);

    userStore.setUserProfile({
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profilePicture,
      thumbnailPicture: thumbnail,
      bio: ""
    });

    const status = await ad4mClient.agent.status();

    userStore.updateAgentStatus(status);

    userStore.addAgentProfileProxyPerspectiveId(userPerspective?.uuid!)
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
