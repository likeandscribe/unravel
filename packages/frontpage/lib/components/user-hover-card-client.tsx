"use client";

import useSWR from "swr";
import { DID } from "../data/atproto/did";
import { HoverCardTrigger, HoverCardContent } from "./ui/hover-card";
import { ReactNode, Suspense } from "react";
import { Skeleton } from "./ui/skeleton";
import { CalendarIcon } from "@radix-ui/react-icons";

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
        <div className="flex justify-between gap-x-4">
          <div>{avatar}</div>
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
      <h4 className="text-sm font-semibold">@{data.handle}</h4>
      <p className="text-sm">
        The React Framework – created and maintained by @vercel.
      </p>
      <div className="flex items-center pt-2">
        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />{" "}
        <span className="text-xs text-muted-foreground">
          Joined December 2021
        </span>
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

async function getHoverCardData(did: DID): Promise<{ handle: string }> {
  return new Promise<number>(() => {});
}
