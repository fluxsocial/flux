import "preact/debug";
import { toCustomElement } from "@coasys/ad4m-react-hooks";
import MyComponent from "./App";
import CommentSection from "@coasys/flux-comment-section";

if (!customElements.get("comment-section")) {
  customElements.define("comment-section", CommentSection);
}

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source"],
  { shadow: false }
);

export default CustomElement;
