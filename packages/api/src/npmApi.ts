export type FluxApp = {
  created: string;
  pkg: string;
  org: string;
  version: string;
  name: string;
  description: string;
  icon: string;
  ad4mVersion?: string;
};

export async function getApp(name: string): Promise<FluxApp> {
  const res = await fetch(`https://registry.npmjs.org/${name}`);
  const pkg = await res.json();
  const latest = pkg["dist-tags"].latest;
  const { fluxapp, dependencies } = pkg.versions[latest];

  const ad4mVersion = (dependencies && dependencies["@coasys/ad4m"]) || "0.0.0";

  return {
    created: pkg.time.created,
    pkg: pkg.name,
    version: latest,
    org: "",
    name: fluxapp?.name || pkg.name,
    description: fluxapp?.description || pkg.description,
    icon: fluxapp?.icon || "",
    ad4mVersion,
  };
}

export async function getAllFluxApps(): Promise<FluxApp[]> {
  const res = await fetch(
    "https://registry.npmjs.org/-/v1/search?text=keywords:flux-plugin",
    {
      cache: "no-store",
    }
  );

  const json = await res.json();

  const packages = json.objects.map((o: any) => getApp(o.package.name));

  return Promise.all(packages);
}

export function getOfflineFluxApps(): FluxApp[] {
  const packages = [
    "chat-view",
    "post-view",
    "graph-view",
    "webrtc-view",
    "table-view",
    "kanban-board",
  ];

  const fluxApps = packages.map((name) => ({
    created: "",
    pkg: `@coasys/${name}`,
    version: "latest",
    org: "",
    name,
    description: "Offline fallback",
    icon: "",
  }));

  return fluxApps;
}

export async function generateWCName(str: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const firstPart = hashBase64
    .substr(0, 5)
    .toLowerCase()
    .replace(/[^a-z]/g, (c) => alphabet[c.charCodeAt(0) % alphabet.length]);
  const secondPart = hashBase64
    .substr(5, 4)
    .toLowerCase()
    .replace(/[^a-z]/g, (c) => alphabet[c.charCodeAt(0) % alphabet.length]);
  return `${firstPart}-${secondPart}`;
}
