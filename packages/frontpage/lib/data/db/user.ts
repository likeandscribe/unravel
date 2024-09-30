import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { DID } from "../atproto/did";
import * as schema from "@/lib/schema";

type ModerateUserInput = {
  userDid: DID;
  hide: boolean;
};

export async function moderateUser({ userDid, hide }: ModerateUserInput) {
  await db
    .update(schema.LabelledProfile)
    .set({ isHidden: hide })
    .where(eq(schema.LabelledProfile.did, userDid));
}
