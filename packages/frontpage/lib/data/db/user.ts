import { db } from "@/lib/db";
import { DID } from "../atproto/did";
import * as schema from "@/lib/schema";

type ModerateUserInput = {
  userDid: DID;
  hide: boolean;
  label?: string;
};

export async function moderateUser({
  userDid,
  hide,
  label,
}: ModerateUserInput) {
  console.log(`Moderating user, setting hidden to ${hide}`);
  await db
    .insert(schema.LabelledProfile)
    .values({ did: userDid, isHidden: hide, labels: label })
    .onConflictDoUpdate({
      target: schema.LabelledProfile.did,
      set: { isHidden: hide, labels: label },
    });
}
