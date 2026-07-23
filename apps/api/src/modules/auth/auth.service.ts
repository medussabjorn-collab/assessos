import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private firebaseReady = false;

  constructor() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(
      /\\n/g,
      '\n'
    );

    // Only initialize Firebase when all credentials are present, so the
    // service boots in environments where auth isn't configured yet.
    if (projectId && clientEmail && privateKey) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
      }
      this.firebaseReady = true;
    } else {
      this.logger.warn(
        'Firebase credentials not configured — auth endpoints are disabled until FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.',
      );
    }
  }

  async verifyIdToken(token: string) {
    if (!this.firebaseReady) {
      throw new Error('Authentication is not configured on this server.');
    }
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid token: ${message}`);
    }
  }

  async getUserByUid(uid: string) {
    const user = await admin.auth().getUser(uid);
    return user;
  }

  // Creates the real Firebase account for an admin-invited user, no password
  // set — they set one themselves via the link from generatePasswordResetLink.
  async createFirebaseUser(email: string, displayName: string) {
    if (!this.firebaseReady) {
      throw new Error('Authentication is not configured on this server.');
    }
    return admin.auth().createUser({ email, displayName, emailVerified: false });
  }

  async generatePasswordResetLink(email: string): Promise<string> {
    if (!this.firebaseReady) {
      throw new Error('Authentication is not configured on this server.');
    }
    return admin.auth().generatePasswordResetLink(email);
  }

  async updateFirebaseUserEmail(uid: string, email: string) {
    if (!this.firebaseReady) {
      throw new Error('Authentication is not configured on this server.');
    }
    return admin.auth().updateUser(uid, { email });
  }
}
