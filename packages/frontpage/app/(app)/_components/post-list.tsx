"use client";

import useSWRInfinite from "swr/infinite";
import { getMorePostsAction } from "../actions";
import { Fragment, Suspense, startTransition } from "react";
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
        limit: 10,
        nextCursor: cursor[1] as number,
      });
      return data;
    },
    { suspense: true },
  );

  return (
    <div className="space-y-6">
      {data?.map((page, indx) => {
        return (
          <Suspense
            key={page.nextCursor}
            fallback={<p className="text-center text-gray-400">Loading...</p>}
          >
            {page.postCards}

            {indx === data.length - 1 ? (
              page.postCards.length === 0 ? (
                <p className="text-center text-gray-400">No posts remaining</p>
              ) : (
                <p ref={inViewRef} className="text-center text-gray-400">
                  Loading...
                </p>
              )
            ) : null}
          </Suspense>
        );
      })}
    </div>
  );
}
