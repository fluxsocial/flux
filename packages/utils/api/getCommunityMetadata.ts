import {
  SELF,
  FLUX_GROUP_NAME,
  FLUX_GROUP_DESCRIPTION,
  FLUX_GROUP_IMAGE,
  FLUX_GROUP_THUMBNAIL,
} from "utils/constants/communityPredicates";
import { DexieIPFS } from "utils/helpers/storageHelpers";
import { getImage } from "utils/helpers/getImage";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Literal } from "@perspect3vism/ad4m";
import { CommunityMetaData } from "../types";

export default async function getCommunityMetadata(
  communityId: string
): Promise<CommunityMetaData> {
  const client = await getAd4mClient();
  const dexie = new DexieIPFS(communityId);

  const groupMetaData = await client.perspective.queryProlog(
    communityId,
    `
  triple("${SELF}", "${FLUX_GROUP_NAME}", GN);
  triple("${SELF}", "${FLUX_GROUP_DESCRIPTION}", GD);
  triple("${SELF}", "${FLUX_GROUP_IMAGE}", GI);
  triple("${SELF}", "${FLUX_GROUP_THUMBNAIL}", GT).`
  );

  const group = {
    name: "",
    description: "",
    image: "",
    thumbnail: "",
  };

  if (groupMetaData) {
    for (const link of groupMetaData) {
      if (typeof link.GN == "string") {
        try {
          const nameExp = await Literal.fromUrl(link.GN).get();
          group.name = nameExp.data;
        } catch (e) {
          console.error("Error getting group name", e);
        }
      } else if (typeof link.GD == "string") {
        try {
          const descriptionExp = await Literal.fromUrl(link.GD).get();
          group.description = descriptionExp.data;
        } catch (e) {
          console.error("Error getting group description", e);
        }
      } else if (typeof link.GI == "string") {
        const image = await getImage(link.GI);

        await dexie.save(link.GI, image);

        group.image = link.GI;
      } else if (typeof link.GT == "string") {
        const image = await getImage(link.GT);

        await dexie.save(link.GT, image);

        group.thumbnail = link.GT;
      }
    }
  }

  return group;
}