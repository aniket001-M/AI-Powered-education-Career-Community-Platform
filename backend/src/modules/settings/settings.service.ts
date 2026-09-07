import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserSettings, IUserSettings } from '@/models/UserSettings.model';
import { User } from '@/models/User.model';
import { RefreshSession } from '@/models/RefreshSession.model';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';
import {
  UpdateSettingsDto,
  ChangePasswordDto,
  DeleteAccountDto,
} from './settings.validation';

export class SettingsService {
  /**
   * SETTINGS-01: Get Settings
   */
  async getSettings(userId: string): Promise<IUserSettings> {
    let settings = await UserSettings.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!settings) {
      settings = await UserSettings.create({
        userId: new mongoose.Types.ObjectId(userId),
        emailNotifications: true,
        pushNotifications: true,
        theme: 'system',
        profileVisibility: 'COLLEGE_ONLY',
      });
    }

    return settings;
  }

  /**
   * SETTINGS-02: Update Settings
   */
  async updateSettings(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<IUserSettings> {
    let settings = await this.getSettings(userId);

    if (dto.emailNotifications !== undefined) {
      settings.emailNotifications = dto.emailNotifications;
    }
    if (dto.pushNotifications !== undefined) {
      settings.pushNotifications = dto.pushNotifications;
    }
    if (dto.theme !== undefined) {
      settings.theme = dto.theme;
    }
    if (dto.profileVisibility !== undefined) {
      settings.profileVisibility = dto.profileVisibility;
    }

    await settings.save();
    return settings;
  }

  /**
   * SETTINGS-03: Change Password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw AppError.notFound('User account not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError(
        400,
        ErrorCode.INVALID_CREDENTIALS,
        'Current password is incorrect',
      );
    }

    // Hash new password
    const saltRounds = 10;
    const newHash = await bcrypt.hash(dto.newPassword, saltRounds);

    user.passwordHash = newHash;
    await user.save();

    // Revoke all active refresh sessions for security
    await RefreshSession.updateMany(
      { userId: user._id, isRevoked: false },
      { $set: { isRevoked: true } },
    );

    return { message: 'Password updated successfully. Please log in again.' };
  }

  /**
   * SETTINGS-04: Delete / Deactivate Account
   */
  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw AppError.notFound('User account not found');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(
        400,
        ErrorCode.INVALID_CREDENTIALS,
        'Incorrect password confirmation',
      );
    }

    // Soft delete user account
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    // Revoke all sessions
    await RefreshSession.updateMany(
      { userId: user._id },
      { $set: { isRevoked: true } },
    );

    return {
      message: 'Account successfully deactivated and scheduled for deletion',
    };
  }
}

export const settingsService = new SettingsService();
