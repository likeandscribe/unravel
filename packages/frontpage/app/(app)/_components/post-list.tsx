"use client";

import useSWRInfinite from "swr/infinite";
import { getMorePostsAction, type Page } from "../actions";
import { Fragment, startTransition } from "react";
import { useInView } from "react-intersection-observer";

export function PostList() {
  const { data, size, setSize } = useSWRInfinite(
    (_, previousPageData: Page | null) => {
      if (previousPageData && !previousPageData.postCards.length) return null; // reached the end
      return ["posts", previousPageData?.nextCursor ?? 0];
    },
    ([_, cursor]) => {
      return getMorePostsAction(cursor);
    },
    { suspense: true, revalidateOnMount: false },
  );
  const { ref: inViewRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        startTransition(() => void setSize(size + 1));
      }
    },
  });

  // Data can't be undefined because we are using suspense. This is likely a bug in the swr types.
  const pages = data!;

  return (
    <div className="space-y-6">
      {pages.map((page, indx) => {
        return (
          <Fragment key={page.nextCursor}>
            {page.postCards}

            {indx === pages.length - 1 ? (
              page.postCards.length === 0 ? (
                <p className="text-center text-gray-400">No posts remaining</p>
              ) : (
                <p ref={inViewRef} className="text-center text-gray-400">
                  Loading...
                </p>
              )
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
