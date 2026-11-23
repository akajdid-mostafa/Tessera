import NumberFlow, { type Format } from "@number-flow/react";
import { cn } from "@/registry/antuikit/lib/utils";

export interface AnimatedNumberProps {
  value: number;
  format?: Format;
  prefix?: string;
  suffix?: string;
  locales?: string;
  className?: string;
  /** Spin digits up or down by the sign of the change (default) or always one way. */
  trend?: -1 | 0 | 1;
  /**
   * Keeps every digit on its own compositor layer between changes. Off by default:
   * with it on, a page of widgets held thousands of idle layers. Turn it on only for
   * a number that ticks several times a second.
   */
  willChange?: boolean;
}

/** A rolling-digit number. Each digit spins on its own column, Apple-style. */
export function AnimatedNumber({
  value,
  format,
  prefix,
  suffix,
  locales = "en-US",
  className,
  trend,
  willChange = false,
}: AnimatedNumberProps) {
  return (
    <NumberFlow
      value={value}
      format={format}
      prefix={prefix}
      suffix={suffix}
      locales={locales}
      trend={trend}
      willChange={willChange}
      className={cn("tabular", className)}
      transformTiming={{ duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      spinTiming={{ duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    />
  );
}
