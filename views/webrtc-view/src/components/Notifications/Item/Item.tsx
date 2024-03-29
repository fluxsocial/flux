import { useState, useEffect } from "preact/hooks";
import { Profile } from "@coasys/flux-types";
import { getProfile } from "@coasys/flux-api";
import { Notification } from "../../../context/UiContext";

import styles from "./Item.module.css";

type Props = {
  data: Notification;
};

export default function Item({ data }: Props) {
  const [user, setUser] = useState<Profile>();

  // Get user details
  useEffect(() => {
    async function fetchAgent() {
      const profileResponse = await getProfile(data.userId);
      setUser(profileResponse);
    }

    if (!user) {
      fetchAgent();
    }
  }, [data]);

  return (
    <div className={styles.item}>
      <span>
        {user?.username || <j-skeleton width="xxl" height="text"></j-skeleton>}
      </span>
      <span>
        {data.type === "connect" && "is connecting"}
        {data.type === "join" && "joined the room"}
        {data.type === "leave" && "left the room"}
      </span>
    </div>
  );
}
