import { LinkExpression, Literal } from "@perspect3vism/ad4m";

type MapKey = string;
type Predicate = string;

type Map = {
  [x: MapKey]: Predicate;
};

export function mapLiteralLinks(
  links: LinkExpression[] | undefined,
  map: Map
): Map {
  return Object.keys(map).reduce((acc, key) => {
    const predicate = map[key];
    const link = links?.find((link) => link.data.predicate === predicate);
    if (link) {
      return { ...acc, [key]: Literal.fromUrl(link.data.target).get() };
    }
    return acc;
  }, {});
}