import { db, handleFirestoreError, OperationType } from "../../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc,
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { Campaign, CampaignStatus, PricingAuditLog } from "../../types";

function sanitizeData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export const campaignsService = {
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const snap = await getDocs(query(collection(db, "campaigns"), orderBy("createdAt", "desc")));
      const list: Campaign[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Campaign);
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "campaigns");
      return [];
    }
  },

  async logAudit(action: string, adminEmail: string, details: string, campaignId?: string, campaignTitle?: string, affectedCoursesCount?: number): Promise<void> {
    try {
      await addDoc(collection(db, "pricingAuditLogs"), {
        action,
        adminEmail,
        details,
        campaignId: campaignId || "",
        campaignTitle: campaignTitle || "",
        affectedCoursesCount: affectedCoursesCount || 0,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to write pricing audit log:", err);
    }
  },

  async createCampaign(campaignData: Omit<Campaign, "id">, adminEmail: string): Promise<string> {
    try {
      const colRef = collection(db, "campaigns");
      const docRef = doc(colRef); // Generate ID
      const newCampaign = sanitizeData({
        ...campaignData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminEmail
      });
      await setDoc(docRef, newCampaign);

      await this.logAudit(
        "CREATE_CAMPAIGN",
        adminEmail,
        `Created campaign '${campaignData.title}' (${campaignData.adjustmentType}: ${campaignData.adjustmentValue})`,
        docRef.id,
        campaignData.title
      );

      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "campaigns");
      throw err;
    }
  },

  async updateCampaign(id: string, updates: Partial<Campaign>, adminEmail: string): Promise<void> {
    try {
      const docRef = doc(db, "campaigns", id);
      await updateDoc(docRef, sanitizeData({
        ...updates,
        updatedAt: serverTimestamp()
      }));

      await this.logAudit(
        "UPDATE_CAMPAIGN",
        adminEmail,
        `Updated campaign '${updates.title || id}'`,
        id,
        updates.title
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `campaigns/${id}`);
      throw err;
    }
  },

  async updateStatus(id: string, status: CampaignStatus, campaignTitle: string, adminEmail: string): Promise<void> {
    try {
      const docRef = doc(db, "campaigns", id);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      });

      await this.logAudit(
        `CAMPAIGN_${status.toUpperCase()}`,
        adminEmail,
        `Status changed to ${status} for campaign '${campaignTitle}'`,
        id,
        campaignTitle
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `campaigns/${id}`);
      throw err;
    }
  },

  async deleteCampaign(id: string, campaignTitle: string, adminEmail: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "campaigns", id));
      await this.logAudit(
        "DELETE_CAMPAIGN",
        adminEmail,
        `Deleted campaign '${campaignTitle}'`,
        id,
        campaignTitle
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `campaigns/${id}`);
      throw err;
    }
  },

  async getAuditLogs(): Promise<PricingAuditLog[]> {
    try {
      const snap = await getDocs(query(collection(db, "pricingAuditLogs"), orderBy("timestamp", "desc")));
      const list: PricingAuditLog[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PricingAuditLog);
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "pricingAuditLogs");
      return [];
    }
  }
};
