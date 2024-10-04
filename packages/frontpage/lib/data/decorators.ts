/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { startSpan } from "@sentry/nextjs";
import { cache } from "react";

type AnyFunction = (...args: any[]) => any;

export function reactCached<TFn extends AnyFunction>(
  target: TFn,
  _context: ClassMethodDecoratorContext,
): void | TFn {
  return cache(target);
}

/**
 * A decorator usable to wrap arbitrary functions with spans.
 */
export function traced({ spanName }: { spanName?: string } = {}) {
  return function <TFn extends AnyFunction>(
    target: TFn,
    context: ClassMethodDecoratorContext,
  ): void | TFn {
    // @ts-expect-error Safety
    return function (...args: unknown[]) {
      return startSpan(
        {
          op: "function",
          name: spanName ?? String(context.name),
        },
        () => {
          // @ts-expect-error Safety
          return target.apply(this, args);
        },
      );
    };
  };
}
