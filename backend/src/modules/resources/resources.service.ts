import mongoose from 'mongoose';
import { Resource, IResource } from '@/models/Resource.model';
import { ResourceProgress } from '@/models/ResourceProgress.model';
import { Skill } from '@/models/Skill.model';
import { AppError } from '@/common/errors/AppError';
import { UserRole } from '@/common/enums/roles.enum';
import { getRedisClient } from '@/config/redis';
import { logger } from '@/common/utils/logger';
import {
  ListResourcesDto,
  CreateResourceDto,
  UpdateResourceDto,
} from './resources.validation';

export class ResourcesService {
  /**
   * Helper to resolve resource by ObjectId or slug
   */
  async resolveResource(idOrSlug: string): Promise<IResource> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const resource = await Resource.findOne(query);
    if (!resource) {
      throw AppError.notFound(`Resource '${idOrSlug}' not found`);
    }
    return resource;
  }

  /**
   * RESOURCE-01: List Resources
   */
  async getResources(query: ListResourcesDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isActive: true };

    if (query.type) filter.type = query.type;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.subject) filter.subject = new RegExp(query.subject, 'i');
    if (query.college) filter.college = new RegExp(query.college, 'i');

    if (query.skill) {
      const isObjectId = mongoose.Types.ObjectId.isValid(query.skill);
      const skillQuery = isObjectId
        ? { $or: [{ _id: query.skill }, { slug: query.skill }] }
        : { slug: query.skill };
      const skill = await Skill.findOne(skillQuery);
      if (skill) {
        filter.skillId = skill._id;
      }
    }

    if (query.search) {
      filter.$or = [
        { title: new RegExp(query.search, 'i') },
        { description: new RegExp(query.search, 'i') },
        { subject: new RegExp(query.search, 'i') },
      ];
    }

    const isCacheable =
      !query.search &&
      !query.skill &&
      !query.subject &&
      !query.type &&
      !query.difficulty &&
      !query.college &&
      page === 1;

    const cacheKey = `cache:resources:p${page}:l${limit}`;

    if (isCacheable) {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (err) {
        logger.warn('Redis read failed in getResources:', err);
      }
    }

    const [items, total] = await Promise.all([
      Resource.find(filter)
        .populate('skillId', 'name slug category')
        .populate('uploadedBy', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resource.countDocuments(filter),
    ]);

    const result = {
      items: items.map((r: any) => ({
        id: r._id.toString(),
        title: r.title,
        slug: r.slug,
        description: r.description,
        type: r.type,
        url: r.url,
        storageKey: r.storageKey,
        skill: r.skillId
          ? {
              id: r.skillId._id.toString(),
              name: r.skillId.name,
              slug: r.skillId.slug,
            }
          : null,
        subject: r.subject,
        college: r.college,
        department: r.department,
        difficulty: r.difficulty,
        uploader: r.uploadedBy
          ? {
              id: r.uploadedBy._id.toString(),
              name: r.uploadedBy.name,
            }
          : null,
        verificationStatus: r.verificationStatus,
        accessCount: r.accessCount,
        completionCount: r.completionCount,
        createdAt: r.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };

    if (isCacheable) {
      try {
        const redis = getRedisClient();
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
      } catch (err) {
        logger.warn('Redis write failed in getResources:', err);
      }
    }

    return result;
  }

  /**
   * RESOURCE-02: Get Resource by ID or Slug
   */
  async getResourceById(idOrSlug: string) {
    const resource = await this.resolveResource(idOrSlug);
    const populated = await Resource.findById(resource._id)
      .populate('skillId', 'name slug category')
      .populate('uploadedBy', 'name email avatar')
      .lean();

    const r: any = populated;
    return {
      id: r._id.toString(),
      title: r.title,
      slug: r.slug,
      description: r.description,
      type: r.type,
      url: r.url,
      storageKey: r.storageKey,
      skill: r.skillId
        ? {
            id: r.skillId._id.toString(),
            name: r.skillId.name,
            slug: r.skillId.slug,
          }
        : null,
      subject: r.subject,
      college: r.college,
      department: r.department,
      difficulty: r.difficulty,
      uploader: r.uploadedBy
        ? {
            id: r.uploadedBy._id.toString(),
            name: r.uploadedBy.name,
          }
        : null,
      verificationStatus: r.verificationStatus,
      accessCount: r.accessCount,
      completionCount: r.completionCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  /**
   * RESOURCE-03: Create Resource
   */
  async createResource(
    userId: string,
    roles: string[],
    dto: CreateResourceDto,
  ) {
    const isAuthorized = roles.some((r) =>
      [
        UserRole.FACULTY,
        UserRole.ADMIN,
        UserRole.SENIOR,
        UserRole.MODERATOR,
      ].includes(r as UserRole),
    );

    if (!isAuthorized) {
      throw AppError.forbidden(
        'Only faculty, seniors, moderators, and administrators can upload resources',
      );
    }

    // Generate slug from title
    let baseSlug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await Resource.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    let skillId: mongoose.Types.ObjectId | undefined;
    if (dto.skillId) {
      const isObjectId = mongoose.Types.ObjectId.isValid(dto.skillId);
      const s = await Skill.findOne(
        isObjectId
          ? { $or: [{ _id: dto.skillId }, { slug: dto.skillId }] }
          : { slug: dto.skillId },
      );
      if (s) skillId = s._id;
    }

    const resource = await Resource.create({
      title: dto.title,
      slug,
      description: dto.description,
      type: dto.type,
      url: dto.url,
      storageKey: dto.storageKey || null,
      skillId: skillId || null,
      subject: dto.subject || null,
      college: dto.college || null,
      department: dto.department || null,
      difficulty: dto.difficulty || 'INTERMEDIATE',
      uploadedBy: new mongoose.Types.ObjectId(userId),
      verificationStatus: roles.includes(UserRole.ADMIN) || roles.includes(UserRole.FACULTY)
        ? 'VERIFIED'
        : 'PENDING',
    });

    return this.getResourceById(resource._id.toString());
  }

  /**
   * RESOURCE-04: Update Resource
   */
  async updateResource(
    userId: string,
    roles: string[],
    idOrSlug: string,
    dto: UpdateResourceDto,
  ) {
    const resource = await this.resolveResource(idOrSlug);

    const isOwner = resource.uploadedBy.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isOwner && !isElevated) {
      throw AppError.forbidden('You do not have permission to edit this resource');
    }

    if (dto.title !== undefined) resource.title = dto.title;
    if (dto.description !== undefined) resource.description = dto.description;
    if (dto.type !== undefined) resource.type = dto.type;
    if (dto.url !== undefined) resource.url = dto.url;
    if (dto.storageKey !== undefined) resource.storageKey = dto.storageKey;
    if (dto.subject !== undefined) resource.subject = dto.subject;
    if (dto.college !== undefined) resource.college = dto.college;
    if (dto.department !== undefined) resource.department = dto.department;
    if (dto.difficulty !== undefined) resource.difficulty = dto.difficulty;

    if (dto.skillId !== undefined) {
      const isObjectId = mongoose.Types.ObjectId.isValid(dto.skillId);
      const s = await Skill.findOne(
        isObjectId
          ? { $or: [{ _id: dto.skillId }, { slug: dto.skillId }] }
          : { slug: dto.skillId },
      );
      if (s) resource.skillId = s._id;
    }

    await resource.save();

    return this.getResourceById(resource._id.toString());
  }

  /**
   * RESOURCE-05: Delete Resource (Soft delete)
   */
  async deleteResource(userId: string, roles: string[], idOrSlug: string) {
    const resource = await this.resolveResource(idOrSlug);

    const isOwner = resource.uploadedBy.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isOwner && !isElevated) {
      throw AppError.forbidden('You do not have permission to delete this resource');
    }

    resource.isActive = false;
    resource.deletedAt = new Date();
    await resource.save();

    return { message: 'Resource deleted successfully' };
  }

  /**
   * RESOURCE-06: Track Resource Access
   */
  async trackAccess(userId: string, idOrSlug: string) {
    const resource = await this.resolveResource(idOrSlug);

    // Increment global access count on resource
    await Resource.findByIdAndUpdate(resource._id, {
      $inc: { accessCount: 1 },
    });

    // Upsert student progress record
    const progress = await ResourceProgress.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        resourceId: resource._id,
      },
      {
        userId: new mongoose.Types.ObjectId(userId),
        resourceId: resource._id,
        $inc: { accessCount: 1 },
        lastAccessedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    return {
      resourceId: resource._id.toString(),
      resourceTitle: resource.title,
      status: progress.status,
      accessCount: progress.accessCount,
      lastAccessedAt: progress.lastAccessedAt,
    };
  }

  /**
   * RESOURCE-07: Mark Resource Complete
   */
  async markComplete(userId: string, idOrSlug: string) {
    const resource = await this.resolveResource(idOrSlug);

    // Increment global completion count on resource
    await Resource.findByIdAndUpdate(resource._id, {
      $inc: { completionCount: 1 },
    });

    const progress = await ResourceProgress.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        resourceId: resource._id,
      },
      {
        userId: new mongoose.Types.ObjectId(userId),
        resourceId: resource._id,
        status: 'COMPLETED',
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    return {
      resourceId: resource._id.toString(),
      resourceTitle: resource.title,
      status: progress.status,
      completedAt: progress.completedAt,
    };
  }

  /**
   * RESOURCE-08: Get Student Resource History
   */
  async getStudentHistory(userId: string) {
    const history = await ResourceProgress.find({ userId })
      .populate('resourceId')
      .sort({ lastAccessedAt: -1 })
      .lean();

    return history
      .filter((h: any) => h.resourceId != null)
      .map((h: any) => {
        const r = h.resourceId;
        return {
          id: h._id.toString(),
          resourceId: r._id.toString(),
          title: r.title,
          slug: r.slug,
          type: r.type,
          url: r.url,
          status: h.status,
          accessCount: h.accessCount,
          lastAccessedAt: h.lastAccessedAt,
          completedAt: h.completedAt,
        };
      });
  }
}

export const resourcesService = new ResourcesService();
