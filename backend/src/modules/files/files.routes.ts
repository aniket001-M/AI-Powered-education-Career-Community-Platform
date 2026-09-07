import { Router } from 'express';
import * as controller from './files.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { UploadFileDto } from './files.validation';

const router = Router();

// All files endpoints require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: S3-compatible document storage, validation, signed download URLs, and metadata lifecycle
 */

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Upload file metadata and obtain secure S3 storage URL (FILE-01)
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originalName, mimeType, size]
 *             properties:
 *               originalName:
 *                 type: string
 *               mimeType:
 *                 type: string
 *                 example: application/pdf
 *               size:
 *                 type: integer
 *                 example: 204800
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: File recorded with storage key and signed URL
 */
router.post('/upload', validateRequest(UploadFileDto), controller.uploadFile);

/**
 * @swagger
 * /files/{fileId}:
 *   get:
 *     summary: Get file metadata and pre-signed download URL (FILE-02)
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File metadata and fresh download link
 */
router.get('/:fileId', controller.getFile);

/**
 * @swagger
 * /files/{fileId}:
 *   delete:
 *     summary: Soft delete file metadata (FILE-03)
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete('/:fileId', controller.deleteFile);

export { router as filesRouter };
