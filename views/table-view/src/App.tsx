import styles from "./App.module.css";
import { PerspectiveProxy } from "@coasys/ad4m";
import TableView from "./components/TableView";
import "@coasys/flux-ui/dist/main.d.ts";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ agent, perspective, source }: Props) {
  if (!perspective?.uuid || !agent) return "No perspective or agent client";
  return (
    <div className={styles.appContainer}>
      <TableView
        agent={agent}
        perspective={perspective}
        source={source}
      ></TableView>
    </div>
  );
}
