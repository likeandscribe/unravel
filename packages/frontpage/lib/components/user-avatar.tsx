import "server-only";
import { getBlueskyProfile } from "@/lib/data/user";
import { Suspense } from "react";
import {
  AvatarFallback,
  AvatarImage,
  UserAvatarProps,
} from "./user-avatar-shared";

export async function UserAvatar(props: UserAvatarProps) {
  return (
    <Suspense fallback={<AvatarFallback size={props.size} />}>
      <UserAvatarImpl {...props} />
    </Suspense>
  );
}

async function UserAvatarImpl({
  did,
  size: sizeVariant = "small",
}: UserAvatarProps) {
  const { avatar } = await getBlueskyProfile(did);
  return <AvatarImage avatar={avatar} size={sizeVariant} />;
}
