//src/services/issueProforma.ts
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { CateringProforma } from "@/src/services/cateringProforma.service";

const COLLECTION = "catering_proformas";

export async function issueProforma(
  proformaId: string
): Promise<CateringProforma> {
  const ref = doc(db, COLLECTION, proformaId);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Proforma introuvable");
  }

  const proforma = {
    ...(snap.data() as Omit<CateringProforma, "id">),
    id: snap.id,
  } as CateringProforma;

  if (proforma.status !== "draft") {
    throw new Error("La proforma ne peut pas être envoyée");
  }

  const now = serverTimestamp();

  await updateDoc(ref, {
    status: "sent",
    sentAt: now,
    updatedAt: now,
  });

  return {
    ...proforma,
    status: "sent",
    sentAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as CateringProforma;
}