import { findLink, getMetaFromLinks, keyedLanguages } from "@coasys/flux-utils";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";

export default async function getPerspectiveMeta(uuid: string) {
  const client = await getAd4mClient();

  const perspective = await client.perspective.byUUID(uuid);

  if (!perspective || !perspective.neighbourhood) {
    throw new Error("Could not load meta data from perspective");
  }

  const neighbourhood = perspective.neighbourhood.data;

  const links = (neighbourhood.meta?.links as Array<any>) || [];
  const languageLinks = links.filter(findLink.language);
  const langs = await getMetaFromLinks(languageLinks);

  return {
    name: links.find(findLink.name).data.target,
    description: links.find(findLink.description)?.data?.target,
    languages: keyedLanguages(langs),
    url: perspective?.sharedUrl || "",
    dateCreated: links.find(findLink.dateCreated).data.target,
    sourceUrl: perspective?.sharedUrl,
  };
}
