import type { Metadata } from "next";

import { ConfiguratorProvider } from "@/components/order/configurator-context";
import { ConfiguratorShell } from "@/components/order/configurator-shell";
import { getFabrics, getModels, getStyles, getTailors } from "@/lib/data";

export const metadata: Metadata = { title: "Créer une tenue" };

export default async function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [models, fabrics, tailors, styles] = await Promise.all([
    getModels(),
    getFabrics(),
    getTailors(),
    getStyles(),
  ]);

  // Immersive, full-viewport surface — a fixed overlay that always covers the
  // shared site header/footer (MainChrome also strips them after hydration), so
  // there is no page title and the worn preview stays the sole focus.
  return (
    <ConfiguratorProvider data={{ models, fabrics, tailors, styles }}>
      <div className="bg-background fixed inset-0 z-50 overflow-hidden">
        <ConfiguratorShell>{children}</ConfiguratorShell>
      </div>
    </ConfiguratorProvider>
  );
}
