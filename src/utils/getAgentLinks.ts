import { LinkExpression } from "@perspect3vism/ad4m";
import getByDid from "@/core/queries/getByDid";
import getSnapshotByUUID from "@/core/queries/getSnapshotByUUID";

export default async function getAgentLinks(did: string, userPerspective?: string) {
  let links: any[] = [];

  if (userPerspective) {
    // @ts-ignore
    const {links: areaLinks} = await getSnapshotByUUID(userPerspective!)
    // @ts-ignore
    const agentPerspective = await getByDid(did);
  
    const agentLinks = agentPerspective!.perspective!.links;
  
    links = [...areaLinks.filter((e: LinkExpression) => e.data.source !== 'flux://profile'), ...agentLinks.filter(e => e.data.source === 'flux://profile')]
  } else {
    // @ts-ignore
    const agentPerspective = await getByDid(did);
  
    const agentLinks = agentPerspective!.perspective!.links;
  
    links = agentLinks;
  }

  return links;
}