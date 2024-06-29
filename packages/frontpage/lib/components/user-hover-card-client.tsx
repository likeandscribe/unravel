"use client";

import useSWR from "swr";
import { DID } from "../data/atproto/did";
import { HoverCardTrigger, HoverCardContent } from "./ui/hover-card";
import { ReactNode, Suspense } from "react";
import { Skeleton } from "./ui/skeleton";
import { ChatBubbleIcon, Link1Icon } from "@radix-ui/react-icons";
import { ApiRouteResponse } from "../api-route";
import type { GET as GetHoverCardContent } from "@/app/api/hover-card-content/route";
import Link from "next/link";

type Props = {
  did: DID;
  children: ReactNode;
  asChild?: boolean;
  avatar: ReactNode;
  initialHandle: string;
};

export function UserHoverCardClient({
  did,
  children,
  asChild,
  avatar,
  initialHandle,
}: Props) {
  return (
    <>
      <HoverCardTrigger asChild={asChild}>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex gap-4">
          <Link href={`/profile/${initialHandle}`}>{avatar}</Link>
          <div className="flex flex-col gap-1">
            <Suspense fallback={<Fallback handle={initialHandle} />}>
              <Content did={did} />
            </Suspense>
          </div>
        </div>
      </HoverCardContent>
    </>
  );
}

function Content({ did }: { did: DID }) {
  const { data } = useSWR("hoverCard", () => getHoverCardData(did), {
    suspense: true,
  });

  return (
    <>
      <Link href={`/profile/${data.handle}`} className="text-sm font-semibold">
        @{data.handle}
      </Link>
      <div className="flex gap-4">
        <p
          className="text-sm flex gap-2 items-center"
          title={`${data.commentCount} comments`}
        >
          <ChatBubbleIcon /> {data.commentCount}
        </p>
        <p
          className="text-sm flex gap-2 items-center"
          title={`${data.postCount} posts`}
        >
          <Link1Icon /> {data.postCount}
        </p>
      </div>
    </>
  );
}

function Fallback({ handle }: { handle: string }) {
  return (
    <>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">@{handle}</h4>
      </div>
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </>
  );
}

async function getHoverCardData(
  did: DID,
): Promise<ApiRouteResponse<typeof GetHoverCardContent>> {
  const response = await fetch(`/api/hover-card-content?did=${did}`);
  return response.json();
}
