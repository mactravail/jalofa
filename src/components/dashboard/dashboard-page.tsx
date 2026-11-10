import { DemoBanner } from "@/components/demo-banner";
import { T } from "@/components/i18n/t";

/** L'ossature commune des pages de l'espace pro : titre, sous-titre, contenu. */
export function DashboardPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <DemoBanner />
      <h1 className="text-2xl font-bold tracking-tight"><T>{title}</T></h1>
      <p className="text-muted-foreground mt-1 text-sm"><T>{subtitle}</T></p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
