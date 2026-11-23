import { ArrowUpRight16Regular } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { STORE_URL as AUTHOR_URL } from "./brand";

/**
 * The author's other products on UI8. Prices are copied by hand from the store,
 * so update `price` / `was` here when a sale starts or ends.
 */
const PRODUCTS: { title: string; kind: string; price: string; was?: string; slug: string; cover: string }[] = [
  {
    title: "Sonora Audiobook Kit",
    kind: "4 native codebases",
    price: "$22",
    was: "$49",
    slug: "sonora--audiobook-app",
    cover: "6af0c28986b39e0035738860/604_420_8.webp",
  },
  {
    title: "AI Dock Side Panel",
    kind: "React UI kit",
    price: "$29",
    was: "$59",
    slug: "ai-dock-ai-assistant-side-panel-ui-kit",
    cover: "6ad729d49f6e9e0039db2a57/604_420_1.webp",
  },
  {
    title: "Empty States",
    kind: "179+ animated illustrations",
    price: "$25",
    slug: "empty-states-animated-illustration-system",
    cover: "6ac3f781eccb850039827cad/604_420_1.webp",
  },
  {
    title: "AI Travel Planner",
    kind: "Web & mobile UI kit",
    price: "$24",
    was: "$49",
    slug: "travel-planner---web--mobile-ui-kitv10",
    cover: "67ec62343d1dc10033adab07/604_420_2.webp",
  },
  {
    title: "AI Audiobook App",
    kind: "Mobile UI kit · 100+ screens",
    price: "$12",
    was: "$49",
    slug: "ai-powered-audiobook-app---mobile-app-ui-kitv10",
    cover: "68ae07ad876d490033ee370e/604_420_1.webp",
  },
  {
    title: "Ant Design System",
    kind: "Figma · 1:1 with Ant Design",
    price: "Free",
    slug: "ant-design-system",
    cover: "68ed302840bfdb0039dc7f8a/604_420_1.webp",
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

/** "More from antuikit": the shelf after the last widget shelf, one card per product. */
export function MoreProducts() {
  return (
    <section id="more" className="mt-20 scroll-mt-8">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="m-0 flex items-baseline gap-2.5 text-[14.5px] font-medium text-heading">
          More from antuikit
          <span className="font-mono text-[12px] font-normal text-quaternary">{PRODUCTS.length}</span>
        </h2>
        <a
          href={AUTHOR_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[13px] text-tertiary transition-colors duration-mid hover:text-heading"
        >
          All on UI8 <ArrowUpRight16Regular />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1176px]:grid-cols-3">
        {PRODUCTS.map((p, i) => (
          <motion.a
            key={p.slug}
            href={`https://ui8.net/antuikit/products/${p.slug}`}
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-[22px] bg-widget-surface ring-1 ring-inset ring-widget-ring"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.5, ease: EASE, delay: (i % 3) * 0.06, y: { type: "spring", stiffness: 420, damping: 30 } }}
          >
            {/* UI8 covers are 604 × 420. The tinted fill shows while one loads, or if it never does. */}
            <div className="aspect-[604/420] overflow-hidden bg-fill-tertiary">
              <img
                src={`https://images.ui8.net/product/${p.cover}`}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-3.5">
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-heading">{p.title}</div>
                <div className="mt-0.5 truncate text-[12px] text-tertiary">{p.kind}</div>
              </div>
              <div className="shrink-0 text-right text-[13.5px] font-medium whitespace-nowrap text-heading tabular">
                {p.was ? <span className="mr-1.5 font-normal text-quaternary line-through">{p.was}</span> : null}
                {p.price}
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
