import { Request, Response, NextFunction } from 'express';
import { filesService } from './files.service';
import { sendSuccess, sendCreated } from '@/common/responses/success';
import { UploadFileDto } from './files.validation';

/**
 * FILE-01: Upload File
 */
export async function uploadFile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UploadFileDto;
    const data = await filesService.uploadFile(req.user!.userId, dto);
    sendCreated(res, data, 'File uploaded successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * FILE-02: Get File Metadata & Signed URL
 */
export async function getFile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await filesService.getFile(
      req.user!.userId,
      req.user!.roles,
      req.params.fileId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * FILE-03: Delete File
 */
export async function deleteFile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await filesService.deleteFile(
      req.user!.userId,
      req.user!.roles,
      req.params.fileId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
