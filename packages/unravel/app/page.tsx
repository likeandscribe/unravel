"use client";
import { useLayoutEffect } from "react";

export default function Home() {
  useLayoutEffect(() => {
    // @ts-expect-error
    UnicornStudio.init();
  }, []);

  return (
    <>
      <script
        src="https://cdn.unicorn.studio/v1.2.0/unicornStudio.umd.js"
        integrity="sha384-dLpfEqVDadil7TSM6fSnJrBnRCbfYeiQ6gbOvXQZ+3ER6h8ZmuNK4w1NFHWxygia"
        crossOrigin="anonymous"
        defer
      />
      <div
        className="unicorn-embed w-screen h-screen"
        data-us-project-src="/unravel-unicorn/265fc7b676fe99a6ed6496834107f38b"
        data-us-scale="1"
        data-us-dpi="1.5"
        data-us-disablemobile="true"
      />
    </>
  );
}
