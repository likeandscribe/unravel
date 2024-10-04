import { db } from "@/lib/db";
import { DID } from "../atproto/did";
import * as schema from "@/lib/schema";
import { isAdmin } from "../user";

type ModerateUserInput = {
  userDid: DID;
  hide: boolean;
  label?: string | null;
};

export async function moderateUser({
  userDid,
  hide,
  label,
}: ModerateUserInput) {
  const adminUser = await isAdmin();

  if (!adminUser) {
    throw new Error("User is not an admin");
  }

  console.log(`Moderating user, setting hidden to ${hide}`);
  await db
    .insert(schema.LabelledProfile)
    .values({
      did: userDid,
      isHidden: hide,
      labels: label,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.LabelledProfile.did,
      set: { isHidden: hide, labels: label, updatedAt: new Date() },
    });
}
