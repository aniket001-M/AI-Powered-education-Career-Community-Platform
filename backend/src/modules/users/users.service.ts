import { User } from '@/models/User.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { Role } from '@/models/Role.model';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';
import { UpdateUserDto } from './users.validation';

export class UsersService {
  /**
   * USER-01 Get Current User Profile
   */
  async getMe(userId: string) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const roles = await Role.find({ userId: user._id }).lean();
    const roleNames = roles.map((r) => r.role);

    const studentProfile = await StudentProfile.findOne({ userId }).lean();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      roles: roleNames,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      bio: studentProfile?.bio ?? null,
      phone: studentProfile?.phone ?? null,
      department: studentProfile?.department ?? null,
      year: studentProfile?.year ?? null,
      semester: studentProfile?.semester ?? null,
      college: studentProfile?.college ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * USER-02 Update Profile
   */
  async updateMe(userId: string, data: UpdateUserDto) {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Update user fields
    if (data.name !== undefined) user.name = data.name;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    await user.save();

    // Check if student profile fields are present
    const hasProfileUpdates =
      data.bio !== undefined ||
      data.phone !== undefined ||
      data.department !== undefined ||
      data.year !== undefined ||
      data.semester !== undefined;

    let studentProfile = await StudentProfile.findOne({ userId });

    if (hasProfileUpdates) {
      if (!studentProfile) {
        studentProfile = new StudentProfile({
          userId: user._id,
          academicInterests: [],
          projects: [],
          certifications: [],
          careerGoals: [],
        });
      }

      if (data.bio !== undefined) studentProfile.bio = data.bio;
      if (data.phone !== undefined) studentProfile.phone = data.phone;
      if (data.department !== undefined) studentProfile.department = data.department;
      if (data.year !== undefined) studentProfile.year = data.year;
      if (data.semester !== undefined) studentProfile.semester = data.semester;

      await studentProfile.save();
    }

    return this.getMe(userId);
  }
}

export const usersService = new UsersService();
