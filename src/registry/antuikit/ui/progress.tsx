"use client";

import type { ProgressProps as AntdProgressProps } from "antd";
import { Progress as AntdProgress, ConfigProvider } from "antd";
import { cn } from "@/registry/antuikit/lib/utils";
import { Icon } from "@/registry/antuikit/ui/icon";
import { useTooltipConfig } from "@/registry/antuikit/ui/tooltip";

/** Progress's props, unchanged. */
export interface ProgressProps extends AntdProgressProps {}

const PROGRESS_STATUSES = ["normal", "exception", "active", "success"];

/** antd's own status resolution, reproduced so the icon can match what it paints. */
const resolveStatus = ({
  status,
  percent = 0,
  success,
}: ProgressProps): string => {
  const successPercent =
    success && "percent" in success ? success.percent : undefined;
  const percentNumber = Number.parseInt(String(successPercent ?? percent), 10);
  return !PROGRESS_STATUSES.includes(status as string) && percentNumber >= 100
    ? "success"
    : status || "normal";
};

/**
 * Supplies the pack's glyph for the two states antd draws one in, and stands
 * down everywhere else: a caller's `format`, a hidden info slot, or an inner
 * percent position, all of which antd resolves differently.
 */
const withStatusIcon = (props: ProgressProps): ProgressProps["format"] => {
  const {
    format,
    type = "line",
    percentPosition = {},
    showInfo = true,
  } = props;
  if (format) return format;
  if (!showInfo) return undefined;
  if ((percentPosition.type ?? "outer") === "inner") return undefined;

  const resolved = resolveStatus(props);
  if (resolved !== "success" && resolved !== "exception") return undefined;

  const line = type === "line";
  const name =
    resolved === "success"
      ? line
        ? "success"
        : "check"
      : line
        ? "error"
        : "close";

  return () => <Icon name={name} />;
};

/**
 * Animates the indicator when its content changes. The old node is already
 * gone, so a transition cannot run, but an animation starts when the root's
 * state class begins to match. Keep one rule per state, spelled out: a grouped
 * selector fires only once, and Tailwind cannot see a composed class name.
 */
const POP_IN = [
  "motion-safe:[&.ant-progress-status-success_.ant-progress-indicator]:animate-pop-in",
  "motion-safe:[&.ant-progress-status-exception_.ant-progress-indicator]:animate-pop-in",
  "motion-safe:[&.ant-progress-status-normal_.ant-progress-indicator]:animate-shrink-in",
  "motion-safe:[&.ant-progress-status-active_.ant-progress-indicator]:animate-shrink-in",
];

/**
 * Progress with status icons from your icon pack and an animated indicator.
 *
 * A circle 20px or smaller shows its value in a tooltip, styled as the kit's
 * small tooltip. antd passes that tooltip no props, so it is set through
 * context.
 */
export const Progress = ({ className, ...props }: ProgressProps) => {
  const tooltip = useTooltipConfig("small");

  return (
    <ConfigProvider tooltip={tooltip}>
      <AntdProgress
        {...props}
        format={withStatusIcon(props)}
        className={cn(POP_IN, className)}
      />
    </ConfigProvider>
  );
};

Progress.displayName = "Progress";
