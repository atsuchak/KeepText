import "server-only";

import { auth } from "@/features/auth/auth";
import { db } from "@/integrations/mongo";

export type NoteRecord = {
  _id: string;
  userId: string;
  title: string;
  content: string;
  pinned?: boolean;
  customTitle?: boolean;
};

export const notes = db.collection<NoteRecord>("notes");

export async function signedInUserId(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user.id ?? null;
}
