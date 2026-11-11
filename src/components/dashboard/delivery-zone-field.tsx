import {
  DELIVERY_ADVICE,
  EUROPE_DELIVERY_ADVICE,
  EUROPE_DELIVERY_ZONES,
  EUROPE_RECOMMENDED_ZONE,
  FREE_DELIVERY_ZONES,
  RECOMMENDED_DELIVERY_ZONE,
  type FreeDeliveryZone,
} from "@/lib/delivery";
import { T } from "@/components/i18n/t";

/**
 * JALOFA ne livre rien : le pro dit, pour chacun de ses tissus et de ses modèles,
 * si la livraison est gratuite et où. Il peut tout offrir, ou seulement quelques
 * produits. Un pro installé en Europe (JALOFA EUROPE) a ses propres choix.
 */
export function DeliveryZoneField({
  defaultValue,
  europe = false,
}: {
  defaultValue?: FreeDeliveryZone;
  europe?: boolean;
}) {
  const zones = europe ? EUROPE_DELIVERY_ZONES : FREE_DELIVERY_ZONES;
  const fallback = europe ? EUROPE_RECOMMENDED_ZONE : RECOMMENDED_DELIVERY_ZONE;
  // Un choix qui n'existe pas dans cette liste (pro qui a changé de pays) :
  // on repart du conseil.
  const checked =
    defaultValue && zones.some((z) => z.value === defaultValue) ? defaultValue : fallback;
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium"><T>Livraison</T></legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {zones.map((zone) => (
          <label
            key={zone.value}
            className="has-[:checked]:border-primary has-[:checked]:ring-primary/30 flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-[:checked]:ring-2"
          >
            <input
              type="radio"
              name="delivery_zone"
              value={zone.value}
              defaultChecked={checked === zone.value}
              className="accent-primary size-4"
            />
            <T>{zone.label}</T>
          </label>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        <T>{europe ? EUROPE_DELIVERY_ADVICE : DELIVERY_ADVICE}</T>
      </p>
    </fieldset>
  );
}
