import bcrypt from 'bcrypt';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { env } from '@/config/env';
import { logger } from '@/common/utils/logger';
import { UserRole } from '@/common/enums/roles.enum';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { StudentProfile } from '@/models/StudentProfile.model';

interface DemoUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  profileData?: {
    college: string;
    department: string;
    year: number;
    semester: number;
    cgpa: number;
    bio: string;
    academicInterests: string[];
    projects: {
      title: string;
      description: string;
      techStack: string[];
      url?: string;
      startDate?: Date;
      endDate?: Date;
    }[];
    certifications: {
      title: string;
      issuer: string;
      date?: Date;
      url?: string;
    }[];
  };
}

const DEMO_USERS: DemoUser[] = [
  {
    name: 'Alex Rivera',
    email: 'student@careergraph.dev',
    password: 'Student@123',
    role: UserRole.STUDENT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    profileData: {
      college: 'Apex Institute of Technology',
      department: 'Computer Science and Engineering',
      year: 3,
      semester: 5,
      cgpa: 8.85,
      bio: 'Aspiring Full Stack & Cloud Engineer passionate about distributed systems and interactive web apps.',
      academicInterests: ['Distributed Systems', 'Cloud Architecture', 'Modern Web Technologies', 'DevOps'],
      projects: [
        {
          title: 'CareerGraph Platform',
          description: 'A career-guidance and roadmap platform tailored for engineering students.',
          techStack: ['TypeScript', 'Express', 'MongoDB', 'Redis', 'React'],
          url: 'https://github.com/careergraph/careergraph',
          startDate: new Date('2024-01-15'),
        },
        {
          title: 'Microservices Task Orchestrator',
          description: 'High-throughput async job orchestrator with Redis bull queues.',
          techStack: ['Node.js', 'Redis', 'Docker'],
          url: 'https://github.com/alexrivera/task-orchestrator',
          startDate: new Date('2023-08-10'),
          endDate: new Date('2023-12-20'),
        },
      ],
      certifications: [
        {
          title: 'AWS Certified Cloud Practitioner',
          issuer: 'Amazon Web Services',
          date: new Date('2024-03-01'),
          url: 'https://aws.amazon.com/verification',
        },
        {
          title: 'Meta Front-End Developer Professional Certificate',
          issuer: 'Coursera / Meta',
          date: new Date('2023-11-15'),
        },
      ],
    },
  },
  {
    name: 'Sarah Chen',
    email: 'senior@careergraph.dev',
    password: 'Senior@123',
    role: UserRole.SENIOR,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    name: 'Dr. Robert Vance',
    email: 'faculty@careergraph.dev',
    password: 'Faculty@123',
    role: UserRole.FACULTY,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
  },
  {
    name: 'Elena Rostova',
    email: 'moderator@careergraph.dev',
    password: 'Moderator@123',
    role: UserRole.MODERATOR,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
  },
  {
    name: 'Kavita Rao',
    email: 'mentor@careergraph.dev',
    password: 'Mentor@123',
    role: UserRole.MENTOR,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavita',
  },
  {
    name: 'Marcus Sterling',
    email: 'admin@careergraph.dev',
    password: 'Admin@123',
    role: UserRole.ADMIN,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
  },
];

async function seed() {
  logger.info('Starting CareerGraph database seeding...');
  await connectDatabase();

  try {
    for (const demo of DEMO_USERS) {
      // Find existing or create user
      let user = await User.findOne({ email: demo.email });
      const passwordHash = await bcrypt.hash(demo.password, env.BCRYPT_ROUNDS);

      if (!user) {
        user = await User.create({
          name: demo.name,
          email: demo.email,
          passwordHash,
          avatar: demo.avatar,
          isEmailVerified: true,
          isActive: true,
        });
        logger.info(`Created user: ${demo.email} [${demo.role}]`);
      } else {
        user.name = demo.name;
        user.passwordHash = passwordHash;
        user.avatar = demo.avatar;
        user.isEmailVerified = true;
        user.isActive = true;
        await user.save();
        logger.info(`Updated user: ${demo.email} [${demo.role}]`);
      }

      // Ensure Role record exists
      await Role.findOneAndUpdate(
        { userId: user._id, role: demo.role },
        {
          userId: user._id,
          role: demo.role,
          isPrimary: true,
          assignedAt: new Date(),
        },
        { upsert: true, new: true },
      );

      // Create or update StudentProfile if student
      if (demo.role === UserRole.STUDENT && demo.profileData) {
        await StudentProfile.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            ...demo.profileData,
          },
          { upsert: true, new: true },
        );
        logger.info(`Created/Updated student profile for ${demo.email}`);
      }
    }

    // Seed Careers and Skills taxonomy
    const { seedCareersAndSkills } = await import('./seed-careers-skills');
    await seedCareersAndSkills();

    logger.info('Database seeding completed successfully!');
    logger.info('Demo accounts available:');
    for (const demo of DEMO_USERS) {
      logger.info(`  • [${demo.role.padEnd(9)}] ${demo.email.padEnd(26)} (password: ${demo.password})`);
    }
  } catch (err: any) {
    logger.error('Error seeding database:', { error: err.message, stack: err.stack });
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
    logger.info('Database connection closed.');
  }
}

// Execute seed when run directly
if (require.main === module) {
  seed();
}
