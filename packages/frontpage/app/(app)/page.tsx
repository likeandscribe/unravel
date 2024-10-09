import { unstable_noStore } from "next/cache";
import { PostList } from "./_components/post-list";
import { SWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { getMorePostsAction } from "./actions";

export default async function Home() {
  unstable_noStore();

  return (
    <div className="space-y-6">
      <SWRConfig
        value={{
          fallback: {
            [unstable_serialize(() => ["posts", 0])]: [
              // Calling an action directly is not recommended in the doc but here we do it as a DRY shortcut.
              await getMorePostsAction(0),
            ],
          },
        }}
      >
        <PostList />
      </SWRConfig>
    </div>
  );
}
