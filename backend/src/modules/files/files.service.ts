import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { File, IFile } from '@/models/File.model';
import { AppError } from '@/common/errors/AppError';
import { UserRole } from '@/common/enums/roles.enum';
import { UploadFileDto } from './files.validation';

export class FilesService {
  /**
   * Helper to generate a pre-signed storage URL for S3-compatible storage
   */
  private generateSignedUrl(storageKey: string, isPublic: boolean): string {
    const baseUrl = 'https://assets.careergraph.internal';
    if (isPublic) {
      return `${baseUrl}/public/${storageKey}`;
    }
    const token = uuidv4().replace(/-/g, '');
    const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity
    return `${baseUrl}/secure/${storageKey}?token=${token}&expires=${expires}`;
  }

  /**
   * FILE-01: Upload File Metadata
   */
  async uploadFile(userId: string, dto: UploadFileDto): Promise<IFile> {
    const ext = path.extname(dto.originalName).toLowerCase();
    const cleanBasename = path
      .basename(dto.originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueId = uuidv4().slice(0, 8);
    const storageKey = `uploads/${userId}/${cleanBasename}-${uniqueId}${ext}`;
    const isPublic = Boolean(dto.isPublic);
    const url = this.generateSignedUrl(storageKey, isPublic);

    const file = await File.create({
      uploadedBy: new mongoose.Types.ObjectId(userId),
      originalName: dto.originalName,
      mimeType: dto.mimeType,
      size: dto.size,
      storageKey,
      isPublic,
      url,
    });

    return file;
  }

  /**
   * FILE-02: Get File Metadata and Signed URL
   */
  async getFile(
    userId: string,
    roles: string[],
    fileId: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      throw AppError.notFound(`File '${fileId}' not found`);
    }

    const file = await File.findById(fileId).lean();
    if (!file) {
      throw AppError.notFound(`File '${fileId}' not found`);
    }

    if (!file.isPublic) {
      const isOwner = file.uploadedBy.toString() === userId;
      const isElevated = roles.some((r) =>
        [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
      );

      if (!isOwner && !isElevated) {
        throw AppError.forbidden('You do not have permission to access this private file');
      }
    }

    // Refresh signed URL
    const freshSignedUrl = this.generateSignedUrl(file.storageKey, file.isPublic);

    const f: any = file;
    return {
      id: f._id.toString(),
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
      storageKey: f.storageKey,
      isPublic: f.isPublic,
      downloadUrl: freshSignedUrl,
      createdAt: f.createdAt,
    };
  }

  /**
   * FILE-03: Delete File (Soft delete)
   */
  async deleteFile(userId: string, roles: string[], fileId: string) {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      throw AppError.notFound(`File '${fileId}' not found`);
    }

    const file = await File.findById(fileId);
    if (!file) {
      throw AppError.notFound(`File '${fileId}' not found`);
    }

    const isOwner = file.uploadedBy.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isOwner && !isElevated) {
      throw AppError.forbidden('You do not have permission to delete this file');
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    return { message: 'File deleted successfully' };
  }
}

export const filesService = new FilesService();
