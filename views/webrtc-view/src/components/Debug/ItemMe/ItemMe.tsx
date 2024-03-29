import { Profile } from "@coasys/flux-types";
import { WebRTC } from "@coasys/flux-react-web";
import { format } from "date-fns";

import styles from "./ItemMe.module.css";

type Props = {
  webRTC: WebRTC;
  profile?: Profile;
};

export default function ItemMe({ profile, webRTC }: Props) {
  const sortedEvents = webRTC?.localEventLog?.sort((a, b) =>
    b.timeStamp.localeCompare(a.timeStamp)
  );

  return (
    <div className={styles.item}>
      <j-text variant="heading">Connection #1 (me)</j-text>
      <j-text variant="footnote">{profile?.did}</j-text>

      <div className={styles.row}>
        <j-text variant="label" nomargin>
          Devices:
        </j-text>
        <span>test</span>
      </div>

      <j-box pt={600}>
        <j-text variant="heading-sm">Outgoing signals</j-text>
      </j-box>

      <ul className={styles.events}>
        {sortedEvents.map((e, i) => (
          <li key={`${e.timeStamp}${e.value}${i}`}>
            <div className={styles.eventTitle}>
              <j-text variant="footnote">{e.type}</j-text>
              <j-text variant="footnote">{e.value}</j-text>
            </div>
            <j-text variant="footnote">{`${format(
              new Date(e.timeStamp),
              "HH:mm:ss"
            )}`}</j-text>
          </li>
        ))}
      </ul>
    </div>
  );
}
