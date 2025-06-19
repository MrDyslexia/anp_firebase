import { DocumentReference } from "firebase-admin/firestore";
export interface Comuna {
  id: string;
  name: string;
  regionRef: DocumentReference;
}