"use client";

import { Input } from "@/components/ui/input";
import {
  maskQuantityInput,
  unitSuffix,
  type ProductUnitType,
} from "@/lib/unit-type";
import { cn } from "@/lib/utils";

type QuantityInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  unitType: ProductUnitType;
  className?: string;
  "aria-label"?: string;
};

export function QuantityInput({
  id,
  value,
  onChange,
  unitType,
  className,
  "aria-label": ariaLabel,
}: QuantityInputProps) {
  const suffix = unitSuffix(unitType);

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        inputMode={unitType === "UNIDADE" ? "numeric" : "decimal"}
        autoComplete="off"
        aria-label={ariaLabel}
        placeholder={unitType === "UNIDADE" ? "1" : "0,000"}
        value={value}
        onChange={(event) =>
          onChange(maskQuantityInput(event.target.value, unitType))
        }
        className={cn("tabular-nums", suffix && "pr-8")}
      />
      {suffix ? (
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
