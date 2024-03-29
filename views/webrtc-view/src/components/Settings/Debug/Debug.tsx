import { Profile } from "@coasys/flux-types";
import { WebRTC } from "@coasys/flux-react-web";

import Item from "./Item";

import styles from "./Debug.module.css";
import { defaultSettings } from "../../../constants";
import { Peer } from "../../../types";
import { useContext } from "preact/hooks";
import UiContext from "../../../context/UiContext";

type Props = {
  webRTC: WebRTC;
  profile?: Profile;
};

export default function VoiceVideo({ webRTC, profile }: Props) {
  const {
    methods: { toggleShowDebug },
  } = useContext(UiContext);

  return (
    <>
      <h3>Debug</h3>
      <h4>Connections:</h4>
      <>{!webRTC.hasJoined && "Not yet joined"}</>
      <>
        {webRTC.hasJoined && webRTC.connections.length < 1 && "No connections"}
      </>
      <ul className={styles.list}>
        {webRTC.connections.map((p) => (
          <li key={p.did}>
            <Item peer={p} onSendSignal={webRTC.onSendTestSignal} />
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <j-button
          variant="secondary"
          size="xs"
          onClick={() => toggleShowDebug(true)}
        >
          Full debugger
        </j-button>
        <j-button
          variant="secondary"
          size="xs"
          onClick={webRTC.onSendTestBroadcast}
          disabled={!webRTC.hasJoined}
        >
          Send broadcast
        </j-button>
        <j-button variant="secondary" size="xs" onClick={webRTC.onGetStats}>
          Log RTC stats
        </j-button>
        <j-button
          variant="secondary"
          size="xs"
          onClick={() => {
            console.log(webRTC);
          }}
        >
          Log state
        </j-button>
      </div>
    </>
  );
}
