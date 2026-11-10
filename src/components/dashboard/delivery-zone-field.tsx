import {
  DELIVERY_ADVICE,
  FREE_DELIVERY_ZONES,
  RECOMMENDED_DELIVERY_ZONE,
  type FreeDeliveryZone,
} from "@/lib/delivery";
import { T } from "@/components/i18n/t";

/**
 * JALOFA ne livre rien : le pro dit, pour chacun de ses tissus et de ses modèles,
 * si la livraison est gratuite et où. Il peut tout offrir, ou seulement quelques
 * produits.
 */
export function DeliveryZoneField({
  defaultValue = RECOMMENDED_DELIVERY_ZONE,
}: {
  defaultValue?: FreeDeliveryZone;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium"><T>Livraison</T></legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {FREE_DELIVERY_ZONES.map((zone) => (
          <label
            key={zone.value}
            className="has-[:checked]:border-primary has-[:checked]:ring-primary/30 flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-[:checked]:ring-2"
          >
            <input
              type="radio"
              name="delivery_zone"
              value={zone.value}
              defaultChecked={defaultValue === zone.value}
              className="accent-primary size-4"
            />
            <T>{zone.label}</T>
          </label>
        ))}
      </div>
      <p className="text-muted-foreground text-xs"><T>{DELIVERY_ADVICE}</T></p>
    </fieldset>
  );
}
