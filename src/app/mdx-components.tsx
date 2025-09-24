import type { ReactElement } from "react";

type MDXComponentProps = Record<string, unknown> & { className?: string };
type MDXComponent = (props: MDXComponentProps) => ReactElement;
type MDXComponents = Record<string, MDXComponent>;
import { cn } from "@/lib/utils";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className, ...props }) => (
      <h1 className={cn("mt-6 scroll-m-20 text-3xl font-semibold", className)} {...props} />
    ),
    h2: ({ className, ...props }) => (
      <h2 className={cn("mt-8 scroll-m-20 text-2xl font-semibold", className)} {...props} />
    ),
    h3: ({ className, ...props }) => (
      <h3 className={cn("mt-6 scroll-m-20 text-xl font-semibold", className)} {...props} />
    ),
    p: ({ className, ...props }) => (
      <p className={cn("leading-7 text-muted-foreground", className)} {...props} />
    ),
    ul: ({ className, ...props }) => (
      <ul className={cn("my-6 ml-6 list-disc space-y-2 text-muted-foreground", className)} {...props} />
    ),
    ol: ({ className, ...props }) => (
      <ol className={cn("my-6 ml-6 list-decimal space-y-2 text-muted-foreground", className)} {...props} />
    ),
    a: ({ className, ...props }) => (
      <a className={cn("font-semibold text-foreground underline", className)} {...props} />
    ),
    ...components,
  };
}
