import mongoose from 'mongoose';
import { CommunityPost, ICommunityPost } from '@/models/CommunityPost.model';
import { CommunityComment } from '@/models/CommunityComment.model';
import { CommunityLike } from '@/models/CommunityLike.model';
import { CommunityReport } from '@/models/CommunityReport.model';
import { AppError } from '@/common/errors/AppError';
import { UserRole } from '@/common/enums/roles.enum';
import {
  ListPostsDto,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  ReportPostDto,
} from './community.validation';

export class CommunityService {
  /**
   * COMMUNITY-01: List Posts with filters & pagination
   */
  async getPosts(query: ListPostsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (query.category) {
      filter.category = new RegExp(`^${query.category}$`, 'i');
    }

    if (query.postType) {
      filter.postType = query.postType;
    }

    if (query.tag) {
      filter.tags = { $in: [query.tag.trim()] };
    }

    if (query.authorId && mongoose.Types.ObjectId.isValid(query.authorId)) {
      filter.authorId = new mongoose.Types.ObjectId(query.authorId);
    }

    if (query.search) {
      filter.$or = [
        { title: new RegExp(query.search, 'i') },
        { content: new RegExp(query.search, 'i') },
        { tags: { $in: [new RegExp(query.search, 'i')] } },
      ];
    }

    let sortOption: Record<string, any> = { createdAt: -1 };
    if (query.sort === 'popular') {
      sortOption = { likesCount: -1, createdAt: -1 };
    } else if (query.sort === 'mostCommented') {
      sortOption = { commentsCount: -1, createdAt: -1 };
    }

    const [items, total] = await Promise.all([
      CommunityPost.find(filter)
        .populate('authorId', 'name email avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      CommunityPost.countDocuments(filter),
    ]);

    return {
      items: items.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        content: p.content,
        category: p.category,
        postType: p.postType,
        tags: p.tags,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        reportsCount: p.reportsCount,
        isPinned: p.isPinned,
        author: p.authorId
          ? {
              id: p.authorId._id.toString(),
              name: p.authorId.name,
              email: p.authorId.email,
              avatar: p.authorId.avatar,
            }
          : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * COMMUNITY-02: Get Post by ID
   */
  async getPostById(postId: string, currentUserId?: string) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const post = await CommunityPost.findById(postId)
      .populate('authorId', 'name email avatar')
      .lean();

    if (!post) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    let likedByMe = false;
    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      const exists = await CommunityLike.exists({
        postId: post._id,
        userId: new mongoose.Types.ObjectId(currentUserId),
      });
      likedByMe = Boolean(exists);
    }

    const p: any = post;
    return {
      id: p._id.toString(),
      title: p.title,
      content: p.content,
      category: p.category,
      postType: p.postType,
      tags: p.tags,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      reportsCount: p.reportsCount,
      isPinned: p.isPinned,
      likedByMe,
      author: p.authorId
        ? {
            id: p.authorId._id.toString(),
            name: p.authorId.name,
            email: p.authorId.email,
            avatar: p.authorId.avatar,
          }
        : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  /**
   * COMMUNITY-03: Create Post
   */
  async createPost(userId: string, dto: CreatePostDto) {
    const post = await CommunityPost.create({
      authorId: new mongoose.Types.ObjectId(userId),
      title: dto.title,
      content: dto.content,
      category: dto.category,
      postType: dto.postType || 'DISCUSSION',
      tags: dto.tags || [],
    });

    return this.getPostById(post._id.toString(), userId);
  }

  /**
   * COMMUNITY-04: Update Post
   */
  async updatePost(
    userId: string,
    roles: string[],
    postId: string,
    dto: UpdatePostDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const isAuthor = post.authorId.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isAuthor && !isElevated) {
      throw AppError.forbidden('You do not have permission to edit this post');
    }

    if (dto.title !== undefined) post.title = dto.title;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.category !== undefined) post.category = dto.category;
    if (dto.tags !== undefined) post.tags = dto.tags;

    await post.save();
    return this.getPostById(post._id.toString(), userId);
  }

  /**
   * COMMUNITY-05: Delete Post (Soft delete)
   */
  async deletePost(userId: string, roles: string[], postId: string) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const isAuthor = post.authorId.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isAuthor && !isElevated) {
      throw AppError.forbidden('You do not have permission to delete this post');
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    return { message: 'Post deleted successfully' };
  }

  /**
   * COMMUNITY-06: Add Comment
   */
  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    let parentId: mongoose.Types.ObjectId | null = null;
    if (dto.parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(dto.parentCommentId)) {
        throw AppError.notFound('Parent comment not found');
      }
      const parent = await CommunityComment.findById(dto.parentCommentId);
      if (!parent) {
        throw AppError.notFound('Parent comment not found');
      }
      parentId = parent._id;
    }

    const comment = await CommunityComment.create({
      postId: post._id,
      authorId: new mongoose.Types.ObjectId(userId),
      parentCommentId: parentId,
      content: dto.content,
    });

    // Increment comment count on post
    await CommunityPost.findByIdAndUpdate(post._id, {
      $inc: { commentsCount: 1 },
    });

    const populated = await CommunityComment.findById(comment._id)
      .populate('authorId', 'name email avatar')
      .lean();

    const c: any = populated;
    return {
      id: c._id.toString(),
      postId: c.postId.toString(),
      content: c.content,
      parentCommentId: c.parentCommentId ? c.parentCommentId.toString() : null,
      author: c.authorId
        ? {
            id: c.authorId._id.toString(),
            name: c.authorId.name,
            email: c.authorId.email,
            avatar: c.authorId.avatar,
          }
        : null,
      createdAt: c.createdAt,
    };
  }

  /**
   * COMMUNITY-07: List Comments for Post
   */
  async getComments(postId: string) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const comments = await CommunityComment.find({
      postId: new mongoose.Types.ObjectId(postId),
    })
      .populate('authorId', 'name email avatar')
      .sort({ createdAt: 1 })
      .lean();

    return comments.map((c: any) => ({
      id: c._id.toString(),
      postId: c.postId.toString(),
      content: c.content,
      parentCommentId: c.parentCommentId ? c.parentCommentId.toString() : null,
      author: c.authorId
        ? {
            id: c.authorId._id.toString(),
            name: c.authorId.name,
            email: c.authorId.email,
            avatar: c.authorId.avatar,
          }
        : null,
      createdAt: c.createdAt,
    }));
  }

  /**
   * COMMUNITY-08: Like/Unlike Post Toggle
   */
  async toggleLike(userId: string, postId: string) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const existing = await CommunityLike.findOne({
      postId: post._id,
      userId: userObjId,
    });

    if (existing) {
      // Unlike
      await CommunityLike.findByIdAndDelete(existing._id);
      const updatedPost = await CommunityPost.findByIdAndUpdate(
        post._id,
        { $inc: { likesCount: -1 } },
        { new: true },
      );
      return {
        liked: false,
        likesCount: Math.max(0, updatedPost?.likesCount || 0),
      };
    } else {
      // Like
      await CommunityLike.create({
        postId: post._id,
        userId: userObjId,
      });
      const updatedPost = await CommunityPost.findByIdAndUpdate(
        post._id,
        { $inc: { likesCount: 1 } },
        { new: true },
      );
      return {
        liked: true,
        likesCount: updatedPost?.likesCount || 1,
      };
    }
  }

  /**
   * COMMUNITY-09: Report Post
   */
  async reportPost(userId: string, postId: string, dto: ReportPostDto) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const report = await CommunityReport.create({
      postId: post._id,
      reporterId: new mongoose.Types.ObjectId(userId),
      reason: dto.reason,
      details: dto.details || null,
      status: 'PENDING',
    });

    await CommunityPost.findByIdAndUpdate(post._id, {
      $inc: { reportsCount: 1 },
    });

    return {
      reportId: report._id.toString(),
      message: 'Post reported to moderators for review',
      status: report.status,
    };
  }

  /**
   * COMMUNITY-10: Similar Discussions (plain DB category/tag matching per prompt)
   */
  async getSimilarPosts(postId: string) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const post = await CommunityPost.findById(postId).lean();
    if (!post) {
      throw AppError.notFound(`Post '${postId}' not found`);
    }

    const criteria: any[] = [{ category: post.category }];
    if (post.tags && post.tags.length > 0) {
      criteria.push({ tags: { $in: post.tags } });
    }

    const similar = await CommunityPost.find({
      _id: { $ne: post._id },
      isDeleted: false,
      $or: criteria,
    })
      .populate('authorId', 'name email avatar')
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(5)
      .lean();

    return similar.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      category: p.category,
      postType: p.postType,
      tags: p.tags,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      author: p.authorId
        ? {
            id: p.authorId._id.toString(),
            name: p.authorId.name,
          }
        : null,
      createdAt: p.createdAt,
    }));
  }
}

export const communityService = new CommunityService();
