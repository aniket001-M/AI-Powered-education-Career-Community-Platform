import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '@/common/responses/success';
import { UpdateUserDto } from './users.validation';

/**
 * USER-01: Get Current User Profile
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await usersService.getMe(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * USER-02: Update Profile
 */
export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdateUserDto;
    const data = await usersService.updateMe(req.user!.userId, dto);
    sendSuccess(res, data, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}
