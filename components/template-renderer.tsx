"use client";

import * as React from "react";
import type { ExplainerConfig } from "@/lib/schemas";
import { TemplateFrame } from "@/components/ui-kit/template-chrome";
import { FunnelTemplate } from "@/components/templates/funnel";
import { FlowTemplate } from "@/components/templates/flow";
import { SystemTemplate } from "@/components/templates/system";
import { TradeoffTemplate } from "@/components/templates/tradeoff";
import { SimulatorTemplate } from "@/components/templates/simulator";

/**
 * The one switch on template_id (vivid_build_spec.md §16). The AI never writes
 * interactive code — it only chooses which of these hand-built templates renders
 * and supplies the typed config. The discriminated union makes this exhaustive.
 */
export function TemplateRenderer({
  config,
  className,
}: {
  config: ExplainerConfig;
  className?: string;
}) {
  return (
    <div className={className}>
      <TemplateFrame template={config.template} title={config.title}>
        {renderInner(config)}
      </TemplateFrame>
    </div>
  );
}

function renderInner(config: ExplainerConfig) {
  switch (config.template) {
    case "funnel":
      return <FunnelTemplate config={config} />;
    case "flow":
      return <FlowTemplate config={config} />;
    case "system":
      return <SystemTemplate config={config} />;
    case "tradeoff":
      return <TradeoffTemplate config={config} />;
    case "simulator":
      return <SimulatorTemplate config={config} />;
    default: {
      // exhaustiveness guard — a new template id would fail to compile here
      const _never: never = config;
      return _never;
    }
  }
}
