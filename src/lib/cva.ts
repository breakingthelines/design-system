import type { ClassProp } from 'class-variance-authority/types';

/**
 * The declared type of a cva() helper.
 *
 * bunchee's declaration build cannot inline cva's INFERRED return type: every
 * unannotated `const xVariants = cva(...)` is published as
 * `declare const xVariants: any`. `VariantProps<any>` has no keys, so `variant`
 * and `size` silently vanished from the props of every component that derived
 * them that way, and consumers had to hand-maintain ambient module overrides to
 * put them back (platform, studio and admin-dashboard each carried one).
 *
 * Annotating the const with this type gives the declaration build something it
 * does not have to infer, so the real variant union reaches the published
 * types and `VariantProps<typeof xVariants>` resolves correctly again.
 *
 * Pair it with `satisfies Record<XVariant, string>` on each variants object so
 * the union below and the cva config cannot drift apart.
 */
export type VariantFn<V> = (props?: V & ClassProp) => string;
