import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '@/common/responses/success';
import {
  UpdateSettingsDto,
  ChangePasswordDto,
  DeleteAccountDto,
} from './settings.validation';

/**
 * SETTINGS-01: Get Settings
 */
export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await settingsService.getSettings(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * SETTINGS-02: Update Settings
 */
export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdateSettingsDto;
    const data = await settingsService.updateSettings(req.user!.userId, dto);
    sendSuccess(res, data, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * SETTINGS-03: Change Password
 */
export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as ChangePasswordDto;
    const data = await settingsService.changePassword(req.user!.userId, dto);
    sendSuccess(res, data, data.message);
  } catch (error) {
    next(error);
  }
}

/**
 * SETTINGS-04: Delete Account
 */
export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as DeleteAccountDto;
    const data = await settingsService.deleteAccount(req.user!.userId, dto);
    sendSuccess(res, data, data.message);
  } catch (error) {
    next(error);
  }
}
