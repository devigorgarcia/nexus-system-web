"use client";

import { Input } from "@/components/ui/input";
import { formatMoneyDisplay, parseMoneyInput } from "@/lib/money";
import { cn } from "@/lib/utils";

type MoneyInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function MoneyInput({
  id,
  value,
  onChange,
  placeholder = "0,00",
  disabled,
  className,
  "aria-label": ariaLabel,
}: MoneyInputProps) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={formatMoneyDisplay(value)}
        onChange={(event) => onChange(parseMoneyInput(event.target.value))}
        className="pl-10 tabular-nums"
      />
    </div>
  );
}
