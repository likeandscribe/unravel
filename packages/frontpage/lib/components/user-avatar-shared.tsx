import { DID } from "../data/atproto/did";

const userAvatarSizes = {
  small: 22,
  smedium: 50,
  medium: 100,
  large: 150,
};

type Size = keyof typeof userAvatarSizes;

export type UserAvatarProps = {
  did: DID;
  size?: Size;
};

export function AvatarImage({
  size: sizeVariant = "small",
  avatar,
}: {
  avatar: string;
  size?: UserAvatarProps["size"];
}) {
  const size = userAvatarSizes[sizeVariant];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="rounded-full bg-slate-500"
    />
  );
}

export function AvatarFallback({ size }: { size: UserAvatarProps["size"] }) {
  const sizePx = userAvatarSizes[size ?? "small"];
  return (
    <svg
      className="text-slate-500"
      style={{ width: sizePx, height: sizePx }}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="currentColor" />
    </svg>
  );
}
