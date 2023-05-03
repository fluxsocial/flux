import "@fluxapp/ui/dist/main.css";
import "@fluxapp/ui";
import "@fluxapp/ui/dist/themes/dark.css";

import { LitElement, html, customElement, state, css } from "lit-element";
import { map } from "lit/directives/map.js";

import Ad4mConnectUI, { getAd4mClient } from "@perspect3vism/ad4m-connect";
import { createCommunity } from "utils/api";
import { Channel, Community } from "utils/api";
import { SubjectRepository } from "utils/factory";
import { Ad4mClient } from "@perspect3vism/ad4m";

@customElement("flux-container")
export class MyElement extends LitElement {
  static styles = css`
    :host {
      height: calc(100vh - var(--j-size-xl));
      display: block;
    }
    .sidebar-layout {
      display: grid;
      grid-template-columns: 1fr 5fr;
    }
    .sidebar {
      padding: var(--j-space-500);
      height: 100vh;
      background: var(--j-color-ui-50);
      border-radius: var(--j-border-radius);
    }
    .content {
      margin-left: var(--j-space-500);
    }
    select {
      width: 100%;
      height: var(--j-size-md);
      padding: var(--j-space-300);
      background: var(--j-color-white);
      color: var(--j-color-black);
      font-size: var(--j-font-size-500);
      border-radius: var(--j-border-radius);
      outline: 1px solid var(--j-color-ui-200);
      border: 0;
      border-right: 8px solid transparent;
      padding: var(--j-space-200);
    }
    select:hover {
      background: var(--j-color-ui-50);
    }
    select:focus {
      outline: 2px solid var(--j-color-primary-500);
    }
  `;

  @state()
  client: Ad4mClient | null = null;

  @state()
  perspectives: { uuid: string; name: string }[] = [];

  @state()
  perspectiveUuid = "";

  @state()
  isCreatingCommunity = false;

  source = "";
  community = {};
  channels: { id: any; name: string }[] = [];

  connectedCallback() {
    super.connectedCallback();

    const ui = Ad4mConnectUI({
      appName: "Flux App",
      appDesc: "A flux app",
      appDomain: "app.flux.io",
      capabilities: [{ with: { domain: "*", pointers: ["*"] }, can: ["*"] }],
    });

    ui.connect();
    ui.addEventListener("authstatechange", async () => {
      if (ui.authState === "authenticated") {
        const client = await getAd4mClient();
        this.client = client;

        if (this.perspectiveUuid) {
          this.setPerspective(this.perspectiveUuid);
        }

        const perspectives = await client.perspective.all();

        this.perspectives = perspectives.map((p) => ({
          uuid: p.uuid,
          name: p.name,
        }));
      }
    });
  }

  async setPerspective(uuid: string) {
    const client = await getAd4mClient();
    const perspective = await client.perspective.byUUID(uuid);
    localStorage.setItem("perspectiveUuid", uuid);

    if (!perspective) {
      return;
    }

    this.perspectiveUuid = uuid;

    const community = await new SubjectRepository(Community, {
      perspectiveUuid: perspective.uuid,
    }).getData();

    if (!community) {
      return;
    }

    const channels = await new SubjectRepository(Channel, {
      perspectiveUuid: perspective.uuid,
      source: community.id,
    }).getAllData();

    this.channels = channels.map((c) => ({ id: c.id, name: c.name }));
    this.source = channels[0]?.id;
  }

  setChannel(source: string) {
    localStorage.setItem("source", source);
  }

  setTheme(e: Event) {
    const target = e.target as HTMLInputElement;
    document.documentElement.className = target.value;
  }

  get appElement() {
    const el = this.querySelector("slot");
    return el?.assignedNodes()[0] as HTMLElement;
  }

  shouldUpdate(changedProperties: Map<string, unknown>) {
    if (this.appElement && changedProperties.get("perspective")) {
      this.appElement.setAttribute(
        "perspective",
        changedProperties.get("perspective") as string
      );
    }

    return !!changedProperties;
  }

  async onCreateCommunity() {
    this.isCreatingCommunity = true;
    try {
      await createCommunity({ name: "Test" });
      this.title = "";
      console.log("created community");
    } finally {
      this.isCreatingCommunity = false;
    }
  }

  render() {
    return html`
      <div class="sidebar-layout">
        <aside class="sidebar">
          <j-flex direction="column" gap="500">
            <div>
              <j-text variant="label">Current theme:</j-text>
              <select @change=${(e: Event) => this.setTheme(e)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <j-text variant="label">Select perspective:</j-text>
              <j-flex gap="200" wrap>
                ${map(
                  this.perspectives,
                  (i) => html`<div>
                    <j-avatar
                      ?selected=${this.perspectiveUuid === i.uuid}
                      hash=${i.uuid}
                      @click=${() => this.setPerspective(i.uuid)}
                      :value=${i.uuid}
                    >
                      ${i.name}
                    </j-avatar>
                  </div>`
                )}
              </j-flex>
            </div>

            <div v-if="perspectiveUuid">
              <j-text variant="label">Current channel:</j-text>
              <select
                v-model="source"
                @change="setChannel($event.target.value)"
              >
                <option value="" selected disabled>Select a channel</option>
                ${map(
                  this.channels,
                  (i) => html`<div>
                    <option value=${i.id}>${i.name}</option>
                  </div>`
                )}
              </select>
            </div>

            <j-input
              label="Give your perspective a name"
              placeholder="Perspective name"
              :value="title"
              @change=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this.title = target.value;
              }}
            ></j-input>
            <j-button
              ?loading=${this.isCreatingCommunity}
              @click=${() => this.onCreateCommunity()}
              full
              size="sm"
              id="create-perspective"
            >
              Create new Flux community
            </j-button>
          </j-flex>
        </aside>
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "flux-container": MyElement;
  }
}
