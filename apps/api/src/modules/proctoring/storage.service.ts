import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { createHash, randomUUID } from 'crypto';

// GCS client for evidence-artifact uploads. Same dual-path credential
// pattern as AuthService's Firebase Admin init:
//  - Production (Railway): explicit service-account credentials via
//    GCS_CLIENT_EMAIL/GCS_PRIVATE_KEY env vars — Railway has no ADC.
//  - Local dev: falls back to Application Default Credentials
//    (`gcloud auth application-default login`), no env vars needed.
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storage: Storage | null = null;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || '';
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const clientEmail = process.env.GCS_CLIENT_EMAIL;
    // Railway env vars store literal "\n" — same escaping issue as
    // FIREBASE_PRIVATE_KEY, same fix.
    const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!this.bucketName) {
      this.logger.warn(
        'GCS_BUCKET_NAME not configured — evidence capture is disabled until it is set.',
      );
      return;
    }

    this.storage =
      clientEmail && privateKey
        ? new Storage({ projectId, credentials: { client_email: clientEmail, private_key: privateKey } })
        : new Storage({ projectId }); // ADC (local dev) or Workload Identity (GCP-hosted CI)
  }

  get ready(): boolean {
    return !!this.storage;
  }

  // Uploads raw bytes under a tenant/session-scoped path and returns the
  // reference + a SHA-256 of the actual bytes uploaded — computed here
  // server-side, not trusted from the caller, so EvidenceArtifact.contentHash
  // can't be spoofed to not match what's actually in the bucket.
  async upload(
    tenantId: string,
    sessionId: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ storageRef: string; contentHash: string; sizeBytes: number }> {
    if (!this.storage) {
      throw new Error('Evidence storage is not configured (GCS_BUCKET_NAME unset)');
    }
    const contentHash = createHash('sha256').update(buffer).digest('hex');
    const ext = contentType === 'image/png' ? 'png' : 'jpg';
    const objectPath = `${tenantId}/${sessionId}/${Date.now()}-${randomUUID()}.${ext}`;

    const file = this.storage.bucket(this.bucketName).file(objectPath);
    await file.save(buffer, { contentType, resumable: false });

    return {
      storageRef: `gs://${this.bucketName}/${objectPath}`,
      contentHash,
      sizeBytes: buffer.length,
    };
  }
}
