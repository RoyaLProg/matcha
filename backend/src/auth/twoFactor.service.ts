import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { Database } from 'src/database/Database';
import Users from 'src/interface/users.interface';

@Injectable()
export class TwoFactorService {
  constructor(private readonly database: Database) {}

  generateSecret(username: string): { secret: string; qrCodeUrl: string; manualEntryKey: string } {
    const secret = speakeasy.generateSecret({
      name: `Matcha (${username})`,
      issuer: 'Matcha Dating App',
      length: 32,
    });

    return {
      secret: secret.base32!,
      qrCodeUrl: secret.otpauth_url!,
      manualEntryKey: secret.base32!,
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1, // Allow 1 step before/after for clock skew
    });
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric backup codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  async enableTwoFactor(userId: number, secret: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    await this.database.updateRows('users', 
      { 
        twoFactorSecret: secret, 
        twoFactorEnabled: true,
        backupCodes: JSON.stringify(backupCodes)
      }, 
      { id: userId }
    );
    return backupCodes;
  }

  async disableTwoFactor(userId: number): Promise<void> {
    await this.database.updateRows('users', 
      { twoFactorSecret: null, twoFactorEnabled: false, backupCodes: null }, 
      { id: userId }
    );
  }

  async isTwoFactorEnabled(userId: number): Promise<boolean> {
    const user = await this.database.getFirstRow('users', ['twoFactorEnabled'], { id: userId }) as Users;
    return !!user?.twoFactorEnabled;
  }

  async getUserSecret(userId: number): Promise<string | null> {
    const user = await this.database.getFirstRow('users', ['twoFactorSecret'], { id: userId }) as Users;
    return user?.twoFactorSecret || null;
  }

  async getBackupCodes(userId: number): Promise<string[]> {
    const user = await this.database.getFirstRow('users', ['backupCodes'], { id: userId }) as Users;
    if (!user?.backupCodes) return [];
    try {
      return JSON.parse(user.backupCodes as any) || [];
    } catch {
      return [];
    }
  }

  async verifyBackupCode(userId: number, code: string): Promise<boolean> {
    const backupCodes = await this.getBackupCodes(userId);
    const codeIndex = backupCodes.findIndex(c => c.toUpperCase() === code.toUpperCase());
    
    if (codeIndex === -1) return false;

    // Remove the used backup code
    backupCodes.splice(codeIndex, 1);
    await this.database.updateRows('users', 
      { backupCodes: JSON.stringify(backupCodes) }, 
      { id: userId }
    );
    
    return true;
  }

  async regenerateBackupCodes(userId: number): Promise<string[]> {
    const newBackupCodes = this.generateBackupCodes();
    await this.database.updateRows('users', 
      { backupCodes: JSON.stringify(newBackupCodes) }, 
      { id: userId }
    );
    return newBackupCodes;
  }
}