import { DemoBanner } from "@/components/demo-banner";

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
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
