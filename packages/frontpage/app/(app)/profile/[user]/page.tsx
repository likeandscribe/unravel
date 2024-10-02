import type { DID } from "@/lib/data/atproto/did";
import { getUserPosts } from "@/lib/data/db/post";
import { unstable_noStore } from "next/cache";
import { notFound } from "next/navigation";
import { PostCard } from "../../_components/post-card";
import { UserAvatar } from "@/lib/components/user-avatar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/lib/components/ui/tabs";
import { getBlueskyProfile } from "@/lib/data/user";
import { getUserComments } from "@/lib/data/db/comment";
import { Comment } from "../../post/[postAuthor]/[postRkey]/_lib/comment";
import { Suspense } from "react";
import { getDidFromHandleOrDid } from "@/lib/data/atproto/identity";
import { EllipsisDropdown } from "../../_components/ellipsis-dropdown";
import { ReportButton } from "../../_components/report-button";
import { ReportUserAction } from "@/lib/components/user-hover-card";

type Params = {
  user: string;
};

export default async function Profile({ params }: { params: Params }) {
  unstable_noStore();
  const did = await getDidFromHandleOrDid(params.user);
  if (!did) {
    notFound();
  }

  const [userPosts, userComments, bskyProfile] = await Promise.all([
    getUserPosts(did),
    getUserComments(did),
    getBlueskyProfile(did),
  ]);

  if (!bskyProfile) {
    notFound();
  }

  const overview = [
    ...userPosts.map((p) => ({ ...p, type: "post" as const })),
    ...userComments.map((p) => ({ ...p, type: "comment" as const })),
  ].sort((a, b) => {
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <>
      <div className="flex items-center space-x-4 mb-4">
        <UserAvatar did={did} size="medium" />
        <h1 className="text-2xl font-bold">{bskyProfile.handle}</h1>
        <EllipsisDropdown>
          <ReportButton reportAction={ReportUserAction.bind(null, { did })} />
        </EllipsisDropdown>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="flex flex-col gap-4">
            {overview.map((entity) => {
              if (entity.type === "post") {
                return (
                  <PostCard
                    key={entity.id}
                    author={entity.authorDid}
                    createdAt={entity.createdAt}
                    id={entity.id}
                    title={entity.title}
                    url={entity.url}
                    votes={entity.voteCount}
                    commentCount={entity.commentCount}
                    cid={entity.cid}
                    rkey={entity.rkey}
                    isUpvoted={entity.userHasVoted}
                  />
                );
              }
              if (entity.type === "comment") {
                return (
                  <Comment
                    key={entity.id}
                    comment={entity}
                    postAuthorParam={entity.postAuthorDid as DID}
                    postRkey={entity.postRkey as string}
                  />
                );
              }
            })}
          </div>
        </TabsContent>
        <TabsContent value="posts">
          <Suspense>
            <div className="flex flex-col gap-4">
              {userPosts.map((post) => {
                return (
                  <PostCard
                    key={post.id}
                    author={post.authorDid}
                    createdAt={post.createdAt}
                    id={post.id}
                    title={post.title}
                    url={post.url}
                    votes={post.voteCount}
                    commentCount={post.commentCount}
                    cid={post.cid}
                    rkey={post.rkey}
                    isUpvoted={post.userHasVoted}
                  />
                );
              })}
            </div>
          </Suspense>
        </TabsContent>
        <TabsContent value="comments">
          <Suspense>
            <div className="flex flex-col gap-4">
              {userComments.map((comment) => {
                return (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    postAuthorParam={comment.postAuthorDid as DID}
                    postRkey={comment.postRkey as string}
                  />
                );
              })}
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </>
  );
}
