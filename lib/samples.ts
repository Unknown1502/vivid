import type {
  FunnelConfig,
  FlowConfig,
  SystemConfig,
  TradeoffConfig,
  SimulatorConfig,
  ExplainerConfig,
} from "./schemas";

/**
 * Hardcoded sample configs. Each template was built against its sample first
 * (vivid_build_spec.md §10) so the component is solid before it sees live data.
 * The funnel sample is the seeded interactive example on the landing page.
 */

export const sampleFunnel: FunnelConfig = {
  template: "funnel",
  title: "Trial-to-paid funnel for our SaaS",
  unit: "trials",
  top_value: 8000,
  summary_metric: "Trial → paid conversion",
  stages: [
    {
      label: "Activated a workspace",
      rate: 0.62,
      note: "Signed up → created a workspace",
    },
    {
      label: "Connected a data source",
      rate: 0.45,
      note: "The big leak — integration friction",
    },
    { label: "Invited a teammate", rate: 0.55, note: "Turned solo into a team" },
    {
      label: "Upgraded to paid",
      rate: 0.3,
      note: "Hit the paywall and converted",
    },
  ],
};

export const sampleFlow: FlowConfig = {
  template: "flow",
  title: "OAuth 2.0 authorization code flow",
  orientation: "horizontal",
  steps: [
    {
      id: "redirect",
      label: "App redirects to provider",
      detail:
        "The client sends the user to the authorization server with client_id, scope, redirect_uri and a state value.",
    },
    {
      id: "consent",
      label: "User authenticates & consents",
      detail:
        "The provider verifies the user and shows the consent screen for the requested scopes.",
      branches: [{ to: "redirect", condition: "User denies consent" }],
    },
    {
      id: "code",
      label: "Provider returns an auth code",
      detail:
        "A short-lived authorization code is sent back to the redirect_uri along with the original state.",
    },
    {
      id: "exchange",
      label: "App exchanges code for tokens",
      detail:
        "The server swaps the code (plus client_secret) for an access token and refresh token at the token endpoint.",
    },
    {
      id: "call",
      label: "App calls the API with the token",
      detail:
        "The access token is sent as a Bearer credential; the refresh token renews it when it expires.",
    },
  ],
};

export const sampleSystem: SystemConfig = {
  template: "system",
  title: "HTTP request lifecycle through the stack",
  nodes: [
    { id: "browser", label: "Browser", type: "client" },
    { id: "lb", label: "Load balancer", type: "service" },
    { id: "api", label: "API server", type: "service" },
    { id: "cache", label: "Redis cache", type: "datastore" },
    { id: "db", label: "Postgres", type: "datastore" },
    { id: "stripe", label: "Stripe", type: "external" },
  ],
  edges: [
    { from: "browser", to: "lb", label: "HTTPS" },
    { from: "lb", to: "api", label: "round-robin" },
    { from: "api", to: "cache", label: "read-through" },
    { from: "api", to: "db", label: "SQL" },
    { from: "api", to: "stripe", label: "charge" },
  ],
  request_path: ["browser", "lb", "api", "db"],
};

export const sampleTradeoff: TradeoffConfig = {
  template: "tradeoff",
  title: "Build vs buy: internal analytics",
  options: ["Build in-house", "Buy SaaS", "Open-source + host"],
  criteria: [
    { name: "Time to value", weight: 0.3, scores: [3, 9, 5] },
    { name: "Total cost (3yr)", weight: 0.25, scores: [4, 6, 8] },
    { name: "Customization", weight: 0.2, scores: [9, 4, 8] },
    { name: "Maintenance burden", weight: 0.15, scores: [3, 9, 4] },
    { name: "Data control", weight: 0.1, scores: [9, 5, 8] },
  ],
};

export const sampleSimulator: SimulatorConfig = {
  template: "simulator",
  title: "Pricing that scales with seats",
  inputs: [
    { id: "seats", label: "Seats", min: 1, max: 500, default: 25, step: 1 },
    {
      id: "price",
      label: "Price / seat / mo",
      min: 5,
      max: 100,
      default: 20,
      step: 1,
      unit: "$",
    },
    {
      id: "base",
      label: "Platform base fee / mo",
      min: 0,
      max: 2000,
      default: 200,
      step: 50,
      unit: "$",
    },
  ],
  outputs: [
    {
      label: "Monthly revenue",
      expression: "base + seats * price",
      unit: "$",
    },
    {
      label: "Annual contract value",
      expression: "(base + seats * price) * 12",
      unit: "$",
    },
  ],
  chart: { x_input_id: "seats", output_index: 0 },
};

export const samplesByTemplate: Record<string, ExplainerConfig> = {
  funnel: sampleFunnel,
  flow: sampleFlow,
  system: sampleSystem,
  tradeoff: sampleTradeoff,
  simulator: sampleSimulator,
};

/**
 * Vertical "recipes" for the SaaS sales + onboarding wedge. Same five engine
 * templates under the hood — opinionated names and descriptions that signal
 * depth in the domain. Each hits a DIFFERENT template.
 */
export const exampleChips: { label: string; description: string }[] = [
  {
    label: "Seat + usage pricing",
    description:
      "how our SaaS pricing works: a base platform fee, plus per-seat per-month, plus usage overage per 1,000 API calls",
  },
  {
    label: "Trial-to-paid funnel",
    description:
      "our SaaS trial-to-paid funnel where most users drop off before connecting a data source",
  },
  {
    label: "Source → warehouse",
    description:
      "how data flows through our platform from source connectors, through ingestion, into the warehouse and out to customer dashboards",
  },
  {
    label: "SSO onboarding",
    description:
      "how enterprise SSO onboarding works for a new customer, from SAML setup to a fully provisioned, logged-in user",
  },
  {
    label: "Build vs buy",
    description: "build vs buy for our customer data platform",
  },
];
