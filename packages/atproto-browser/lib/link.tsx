"use client";
// eslint-disable-next-line no-restricted-imports
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { ComponentProps } from "react";

export default function Link(props: ComponentProps<typeof NextLink>) {
  const router = useRouter();
  function prefetch() {
    router.prefetch(props.href.toString());
  }

  return (
    <NextLink
      {...props}
      prefetch={false}
      onMouseEnter={props.prefetch ? prefetch : undefined}
      onTouchStart={props.prefetch ? prefetch : undefined}
    />
  );
}
