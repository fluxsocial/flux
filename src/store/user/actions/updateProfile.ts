import { Profile } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "..";
import { useDataStore } from "@/store/data";
import { ad4mClient } from "@/app";
import { Link, LinkExpression, PerspectiveInput } from "@perspect3vism/ad4m";
import removeTypeName from "@/utils/removeTypeName";
import getAgentLinks from "@/utils/getAgentLinks";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import { FLUX_PROFILE, HAS_BG_IMAGE, HAS_BIO, HAS_PROFILE_IMAGE, HAS_THUMBNAIL_IMAGE, HAS_USERNAME } from "@/constants/profile";
import { resizeImage, dataURItoBlob, blobToDataURL } from "@/utils/profileHelpers";

export interface Payload {
  username?: string;
  profilePicture?: string;
  thumbnail?: string;
  bio?: string;
  profileBg?: string;
}

async function removeLink(links: LinkExpression[], link: Link) {
  const userStore = useUserStore();
  const userPerspective = userStore.getAgentProfileProxyPerspectiveId;

  const foundLink = links.find(
    (e) => e.data.predicate === link.predicate
  );

  if (foundLink) {
    const link = removeTypeName(foundLink);
    await ad4mClient.perspective.removeLink(userPerspective!, link);
  }
}

async function replaceLink(links: LinkExpression[], newLink: Link) {
  const userStore = useUserStore();
  const userPerspective = userStore.getAgentProfileProxyPerspectiveId;

  const foundLink = links.find(
    (e) => e.data.predicate === newLink.predicate
  );

  if (foundLink) {
    const link = removeTypeName(foundLink);
    await ad4mClient.perspective.removeLink(userPerspective!, link);
  }

  const linked = await ad4mClient.perspective.addLink(
    userPerspective!,
    newLink
  );

  return linked;
}

export default async (payload: Payload): Promise<void> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  const currentProfile = userStore.getProfile;
  // TODO: add profilebg here.
  const newProfile = {
    username: payload.username || currentProfile?.username,
    email: currentProfile?.email,
    givenName: currentProfile?.givenName,
    familyName: currentProfile?.familyName,
    profilePicture: payload.profilePicture || currentProfile?.profilePicture,
    thumbnailPicture: payload.thumbnail || currentProfile?.thumbnailPicture,
    bio: payload.bio || currentProfile?.bio
  } as Profile;
  
  userStore.setUserProfile(newProfile);

  const perspectives = await ad4mClient.perspective.all();
  const userPerspective = perspectives.find(e => e.name === "Flux Agent Profile Data");

  if (userPerspective) {
    userStore.addAgentProfileProxyPerspectiveId(userPerspective.uuid)
  } else {
    const error = "No user perspective found";
    appStore.showDangerToast({
      message: error,
    });
    throw new Error(error)
  }

  try {
    const links = await getAgentLinks(userStore.agent.did!, userPerspective.uuid);

    const tempLinks = [...links];

    if (payload.bio) {    
      const bioLink = await replaceLink(links, new Link({
        source: FLUX_PROFILE,
        target: newProfile.bio,
        predicate: HAS_BIO,
      }));
    
      tempLinks.push(bioLink);
    } else {
      removeLink(links, new Link({
        source: FLUX_PROFILE,
        target: newProfile.bio,
        predicate: HAS_BIO,
      }));
    }

    const usernameLink = await replaceLink(links, new Link({
      source: FLUX_PROFILE,
      target: newProfile.username,
      predicate: HAS_USERNAME,
    }));

    if (payload.profileBg) {
      const image = await ad4mClient.expression.create(
        payload.profileBg,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileBgLink = await replaceLink(links, new Link({
        source: FLUX_PROFILE,
        target: image,
        predicate: HAS_BG_IMAGE,
      }));

      tempLinks.push(profileBgLink);
    }

    if (payload.profilePicture) {
      const resizedImage = payload.profilePicture
        ? await resizeImage(dataURItoBlob(payload.profilePicture as string), 100)
        : undefined;
    
      const thumbnail = payload.profilePicture
        ? await blobToDataURL(resizedImage!)
        : undefined;

      const thumbnailImage = await ad4mClient.expression.create(
        thumbnail,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileImage = await ad4mClient.expression.create(
        payload.profilePicture,
        NOTE_IPFS_EXPRESSION_OFFICIAL
      );

      const profileImageLink = await replaceLink(
        links,
        new Link({
          source: FLUX_PROFILE,
          target: profileImage,
          predicate: HAS_PROFILE_IMAGE,
        })
      );
  
      const thumbnailImageLink = await replaceLink(
        links,
        new Link({
          source: FLUX_PROFILE,
          target: thumbnailImage,
          predicate: HAS_THUMBNAIL_IMAGE,
        })
      );

      tempLinks.push(profileImageLink, thumbnailImageLink);
    }

    const finalLinks = [];
    for (const link of [
      ...tempLinks,
      usernameLink
    ]) {
      finalLinks.push(removeTypeName(link));
    }

    await ad4mClient.agent.updatePublicPerspective({
      links: finalLinks,
    } as PerspectiveInput);
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
