import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { useDataStore } from "..";
import { getProfile } from "@/utils/profileHelpers";

type Payload = {
  router: Router;
  route: RouteLocationNormalizedLoaded;
  perspectiveUuid: string;
  authorDid: string;
  message: string;
};

export default async ({
  router,
  route,
  perspectiveUuid,
  authorDid,
  message,
}: Payload) => {
  const dataStore = useDataStore();
  const userStore = useUserStore();

  const escapedMessage = message.replace(/(\s*<.*?>\s*)+/g, " ");

  // Getting the channel & community this message belongs to
  const channel = dataStore.getChannel(perspectiveUuid);
  const community = dataStore.getCommunity(channel.sourcePerspective!);

  const isMinimized = document.hasFocus();

  const { channelId, communityId } = route.params;

  const user = userStore.getUser;

  // Only show the notification when the the message is not from self & the active community & channel is different
  if (
    (!isMinimized &&
      !channel?.notifications.mute &&
      !community?.state.notifications.mute) ||
    (user!.agent.did! !== authorDid &&
      (community?.neighbourhood.perspective.uuid === communityId
        ? channel?.id !== channelId
        : true) &&
      !channel?.notifications.mute &&
      !community?.state.notifications.mute)
  ) {
    const isMentioned = message.includes(
      user!.agent.did!.replace("did:key:", "")
    );

    let title = "";
    let body = "";

    if (isMentioned) {
      const profile = await getProfile(authorDid);
      const name = profile ? profile.username : "Someone";

      title = `${name} mentioned you in #${channel?.name}}`;
      body = escapedMessage;
    } else {
      title = `New message in ${community?.neighbourhood.name}`;
      body = `#${channel?.name}: ${escapedMessage}`;
    }

    if (Notification.permission === "granted") {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const notification = new Notification(title, {
          body,
          icon: "/assets/images/logo.png",
        });
        
        notification.onclick = () => {
          window.focus();

          router.push({
            name: "channel",
            params: {
              communityId: community!.neighbourhood.perspective!.uuid,
              channelId: channel!.id,
            },
          });

          notification.close();
        }

        return notification;
      }
    }
  }

  return undefined;
};
