import { type CSSProperties, type RefObject, useEffect, useRef, useState } from "react";
import type { WidgetEntry } from "@/catalog";
import { InspectContext } from "@/motion/inspect";
import { SPAN } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/** Mount a widget this far before it scrolls into view… */
const MOUNT_MARGIN = "400px 0px";
/** …and unmount it once it is this far away. The gap between the two stops a
 * widget sitting on the edge from mounting and unmounting on every scroll tick. */
const KEEP_MARGIN = "1400px 0px";

function useIntersecting(ref: RefObject<Element | null>, rootMargin: string) {
  const [hit, setHit] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHit(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return hit;
}

/**
 * A widget that only lives while it is near the viewport. Off screen it is a
 * quiet placeholder of the same size, so the grid never shifts, and none of its
 * timers, loops or charts run. Scrolling back mounts it again and it plays its
 * entrance, which reads as the page filling in as you browse.
 */
export function LazyWidget({
  entry,
  index,
  onInspect,
  style,
}: {
  entry: WidgetEntry;
  index: number;
  onInspect: () => void;
  /** On the grid item, e.g. the hero's explicit cell placement. */
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useIntersecting(ref, MOUNT_MARGIN);
  const keep = useIntersecting(ref, KEEP_MARGIN);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (near) setMounted(true);
    else if (!keep) setMounted(false);
  }, [near, keep]);

  return (
    // The grid item. `grid` so the widget inside stretches to the cell, as it
    // would if it were the grid item itself.
    <div
      ref={ref}
      // minmax(0,1fr) on both axes: a widget whose content runs long is clipped
      // by its own card instead of stretching the cell over its neighbours.
      className={cn("grid grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]", SPAN[entry.size])}
      data-widget={entry.id}
      style={style}
    >
      {mounted ? (
        <InspectContext.Provider value={onInspect}>
          <entry.Component index={index % 6} />
        </InspectContext.Provider>
      ) : (
        <div
          aria-hidden
          className="rounded-[calc(var(--ant-border-radius-lg)*2.75)] bg-widget-surface/50 ring-1 ring-inset ring-widget-ring corner-squircle supports-[corner-shape:squircle]:rounded-[calc(var(--ant-border-radius-lg)*4)]"
        />
      )}
    </div>
  );
}
