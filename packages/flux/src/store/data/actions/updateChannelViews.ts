import updateChannelViews from "utils/api/updateChannelViews";
import { useAppStore } from "@/store/app";
import { useDataStore } from "..";
import { ChannelView } from "utils/types";

export interface Payload {
  perspectiveUuid: string;
  channelId: string;
  views: ChannelView[];
}

export default async (payload: Payload): Promise<any> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  const channel = dataStore.channels[payload.channelId];

  if (!channel) {
    appStore.showDangerToast({
      message: "Couldn't find a channel to add the view to",
    });
  }

  try {
    await updateChannelViews({
      perspectiveUuid: payload.perspectiveUuid,
      channelId: channel.id,
      views: payload.views,
    });

    dataStore.putChannelViews({
      channelId: channel.id,
      views: payload.views,
    });
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
