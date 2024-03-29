import { getImage } from "@coasys/flux-utils";
import { useEffect, useState } from "preact/hooks";

type AvatarProps = {
  did: string;
  url?: string;
  src?: string;
  style?: any;
  onClick?: (event: any) => void;
  size?: "" | "xxs" | "xs" | "sm" | "lg" | "xl" | "xxl";
};

export default function Avatar({
  did,
  src,
  url,
  style,
  onClick,
  size = "",
}: AvatarProps) {
  const [loading, setLoading] = useState(false);
  const [img, setImage] = useState(null);

  async function fetchImage(imageUrl) {
    try {
      setLoading(true);
      const image = await getImage(imageUrl);
      setImage(image);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (url) {
      fetchImage(url);
    }
  }, [did, url]);

  return (
    <j-avatar
      style={{ ...style, cursor: onClick ? "pointer" : "default" }}
      hash={did}
      src={img}
      onClick={(e: any) => onClick && onClick(e)}
      size={size}
    ></j-avatar>
  );
}
