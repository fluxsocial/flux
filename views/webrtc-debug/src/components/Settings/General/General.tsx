import { WebRTC } from "../../../hooks/useWebrtc";
import { Me } from "utils/api/getMe";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function General({}: Props) {
  return (
    <div>
      <p>General settings</p>
    </div>
  );
}