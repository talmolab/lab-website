import { tv } from "tailwind-variants";

// PATCHED: `hover:bg-muted` -> `hover:bg-secondary`.
// design/palette.css defines --color-muted as muted TEXT (#555b64); Starwind
// means it as a muted BACKGROUND. The palette wins the name, so bg-muted paints
// dark grey under dark text. bg-sunk (#edf0f4) is the site's real muted surface.
// Any future `starwind add` needs the same substitution — see the Starwind
// bridge note in src/styles/global.css.

export const button = tv({
  base: [
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "transition-all outline-none focus-visible:ring-3",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "aria-invalid:border-error aria-invalid:focus-visible:ring-error/40",
  ],
  variants: {
    variant: {
      default: "bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-outline/50",
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50",
      secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] focus-visible:ring-secondary/50",
      outline: "dark:border-input focus-visible:ring-outline/50 bg-background dark:bg-input/30 focus-visible:border-outline hover:bg-secondary dark:hover:bg-input/50 hover:text-foreground border shadow-xs",
      ghost: "hover:bg-secondary hover:text-foreground focus-visible:ring-outline/50",
      info: "bg-info text-info-foreground hover:bg-info/90 focus-visible:ring-info/50",
      success: "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/50",
      warning: "bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning/50",
      error: "bg-error text-error-foreground hover:bg-error/90 focus-visible:ring-error/50",
    },
    size: {
      sm: "h-9 px-4 text-sm has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-3.5",
      md: "h-11 px-5 text-base has-[>svg]:px-4 [&_svg:not([class*='size-'])]:size-4.5",
      lg: "h-12 px-8 text-lg has-[>svg]:px-6 [&_svg:not([class*='size-'])]:size-5",
      "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
      icon: "size-11 [&_svg:not([class*='size-'])]:size-4.5",
      "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});
