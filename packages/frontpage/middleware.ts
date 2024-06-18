import { middleware as authMiddleware } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export default authMiddleware((req) => {
  if (req.auth) return NextResponse.next();
  const url = new URL(req.url);
  if (url.pathname === "/") return NextResponse.redirect("/authed-homepage");
}) as any;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
