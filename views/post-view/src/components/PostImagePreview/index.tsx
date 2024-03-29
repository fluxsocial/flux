import { useEffect, useState } from "preact/hooks";
import { getImage } from "@coasys/flux-utils";
import styles from "./index.module.css";

type Props = {
  imageUrl?: string;
  base64?: string;
  onRemove: () => void;
};

export default function PostImagePreview({
  imageUrl,
  base64,
  onRemove,
}: Props) {
  const [localBase64, setLocalBase64] = useState(base64);

  async function fetchImage(imageUrl) {
    const image = await getImage(imageUrl);
    setLocalBase64(image);
  }

  useEffect(() => {
    if (imageUrl) {
      fetchImage(imageUrl);
    }
  }, [imageUrl]);

  return (
    <section className={styles.preview}>
      <div className={styles.files}>
        <div className={styles.file}>
          <img className={styles.filePreview} src={localBase64} />

          <j-button
            className={styles.removeButton}
            square
            variant="ghost"
            onClick={() => onRemove()}
          >
            Remove
          </j-button>
        </div>
      </div>
    </section>
  );
}
