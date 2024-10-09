"use client";

import useSWRInfinite from "swr/infinite";
import { getMorePostsAction } from "../actions";
import { Fragment, startTransition } from "react";
import { useInView } from "react-intersection-observer";

export type Page = {
  postCards: JSX.Element[];
  nextCursor: number;
};

export function PostList() {
  const { ref: inViewRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        startTransition(() => void setSize(size + 1));
      }
    },
  });
  const { data, size, setSize } = useSWRInfinite<Page>(
    (_, previousPageData) => {
      if (previousPageData && !previousPageData.postCards.length) return null; // reached the end
      return ["posts", previousPageData?.nextCursor ?? 0] as [string, number];
    },
    async (cursor) => {
      const data = await getMorePostsAction({
        nextCursor: cursor[1] as number,
      });
      return data;
    },
    { suspense: true, revalidateOnMount: false },
  );

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
