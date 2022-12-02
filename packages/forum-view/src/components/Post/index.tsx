import UIContext from "../../context/UIContext";
import PostContext from "utils/react/PostContext";
import CommunityContext from "utils/react/CommunityContext";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { formatRelative, format, formatDistance } from "date-fns";
import styles from "./index.scss";
import { getImage } from "utils/helpers/getImage";
import Avatar from "../Avatar";
import CommentSection from "../CommentSection";
import PostModel from "utils/api/post";
import { useEntry } from "utils/react";

export default function Post({
  perspectiveUuid,
  id,
  source,
}: {
  perspectiveUuid: string;
  id: string;
  source: string;
}) {
  const { methods: UIMethods } = useContext(UIContext);
  const {
    state: { members },
  } = useContext(CommunityContext);

  const { entry: post } = useEntry({
    perspectiveUuid,
    source,
    id,
    model: PostModel,
  });

  const [base64, setBase64] = useState("");

  function onProfileClick(event: any, did: string) {
    event.stopPropagation();
    const e = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
    event.target.dispatchEvent(e);
  }

  async function fetchImage(url) {
    const image = await getImage(url);
    setBase64(image);
  }

  useEffect(() => {
    if (post?.image) {
      fetchImage(post.image);
    }
  }, [post?.image]);

  if (!post) return;

  const author = members[post.author] || {};
  const hasTitle = post.title;
  const hasImage = post.image;
  const hasBody = post.body;
  const hasUrl = post.url;
  const hasDates = post.startDate && post.endDate;

  return (
    <div class={styles.post}>
      <j-box pb="500">
        <j-button size="sm" variant="link" onClick={() => UIMethods.goToFeed()}>
          <j-icon name="arrow-left-short" slot="start"></j-icon>
          Back
        </j-button>
      </j-box>

      <j-box pt="200">
        <j-flex a="center" gap="400">
          <Avatar
            size="sm"
            did={author.did}
            url={author.profileThumbnailPicture}
          ></Avatar>
          <div>
            <div
              className={styles.authorName}
              onClick={(e) => onProfileClick(e, author.did)}
            >
              {author?.username || (
                <j-skeleton width="lg" height="text"></j-skeleton>
              )}
            </div>
            <div class={styles.timestamp}>
              {formatRelative(new Date(post.timestamp), new Date())}
            </div>
          </div>
        </j-flex>
      </j-box>

      {hasTitle && (
        <j-box pt="500">
          <j-text nomargin variant="heading-lg">
            {post.title}
          </j-text>
        </j-box>
      )}

      {hasImage && base64 && (
        <j-box bg="white" mt="600">
          <img class={styles.postImage} src={base64} />
        </j-box>
      )}

      {hasUrl && (
        <j-box pt="400">
          <div class={styles.postUrl}>
            <j-icon size="xs" name="link"></j-icon>
            <a
              onClick={(e) => e.stopPropagation()}
              href={post.url}
              target="_blank"
            >
              {new URL(post.url).hostname}
            </a>
          </div>
        </j-box>
      )}

      {hasDates && (
        <j-box pt="500">
          <j-flex gap="300" direction="column">
            <div class={styles.postDate}>
              <j-icon size="xs" name="calendar-event"></j-icon>
              {format(new Date(post.startDate), "dd.MMMM HH:HH")}
            </div>
            <div class={styles.postDate}>
              <j-icon size="xs" name="clock"></j-icon>
              <j-tooltip
                title={format(new Date(post.endDate), "dd.MMMM HH:HH")}
              >
                {formatDistance(
                  new Date(post.startDate),
                  new Date(post.endDate)
                )}
              </j-tooltip>
            </div>
          </j-flex>
        </j-box>
      )}

      {hasBody && (
        <j-box pt="500">
          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </j-box>
      )}

      <CommentSection
        perspectiveUuid={perspectiveUuid}
        source={post.id}
      ></CommentSection>
    </div>
  );
}
