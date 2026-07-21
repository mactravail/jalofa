"use client";

import { useConfigurator } from "@/components/order/configurator-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/constants";

export default function MetersStep() {
  const { state, update, fabric } = useConfigurator();
  return (
    <div className="max-w-xs space-y-3">
      <Label htmlFor="meters">Nombre de mètres</Label>
      <Input
        id="meters"
        type="number"
        min={0.5}
        step={0.5}
        value={state.fabricMeters}
        onChange={(e) => update({ fabricMeters: Number(e.target.value) })}
      />
      {fabric && (
        <p className="text-muted-foreground text-sm">
          {formatPrice(fabric.price_per_meter)} × {state.fabricMeters} m ={" "}
          <span className="text-foreground font-medium">
            {formatPrice(fabric.price_per_meter * state.fabricMeters)}
          </span>
        </p>
      )}
    </div>
  );
}
