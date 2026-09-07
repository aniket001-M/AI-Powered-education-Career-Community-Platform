import { Career } from '@/models/Career.model';
import { Skill } from '@/models/Skill.model';
import { SkillRelation } from '@/models/SkillRelation.model';
import { CareerSkill } from '@/models/CareerSkill.model';
import { logger } from '@/common/utils/logger';

export const CAREERS_SEED = [
  {
    title: 'Software Engineer',
    slug: 'software-engineer',
    category: 'Engineering',
    description: 'Design, develop, and maintain high-performance, robust software applications and systems.',
    overview: 'As a Software Engineer, you build software that impacts millions of users across modern web, desktop, and mobile platforms.',
    salaryRange: { min: 800000, max: 2400000, currency: 'INR' },
    demandLevel: 'VERY_HIGH' as const,
    growthRate: '+22% (Next 5 Years)',
  },
  {
    title: 'Backend Developer',
    slug: 'backend-developer',
    category: 'Engineering',
    description: 'Architect scalable server-side systems, REST APIs, databases, and microservices.',
    overview: 'Specialize in server-side logic, high throughput data pipelines, transactional integrity, and cloud infrastructure.',
    salaryRange: { min: 900000, max: 2600000, currency: 'INR' },
    demandLevel: 'VERY_HIGH' as const,
    growthRate: '+25% (Next 5 Years)',
  },
  {
    title: 'Data Analyst',
    slug: 'data-analyst',
    category: 'Data & Analytics',
    description: 'Transform raw datasets into actionable commercial and product insights using SQL, BI tools, and Python.',
    overview: 'Help organizations understand user trends, optimize conversions, and execute data-backed strategic moves.',
    salaryRange: { min: 600000, max: 1800000, currency: 'INR' },
    demandLevel: 'HIGH' as const,
    growthRate: '+19% (Next 5 Years)',
  },
  {
    title: 'Data/ML Engineer',
    slug: 'data-ml-engineer',
    category: 'Data & AI',
    description: 'Build enterprise machine learning pipelines, feature stores, and distributed model serving infrastructure.',
    overview: 'Bridge modern machine learning research with production-scale distributed data engineering.',
    salaryRange: { min: 1100000, max: 3200000, currency: 'INR' },
    demandLevel: 'VERY_HIGH' as const,
    growthRate: '+34% (Next 5 Years)',
  },
  {
    title: 'Cybersecurity Analyst',
    slug: 'cybersecurity-analyst',
    category: 'Security',
    description: 'Protect networks, data, and critical infrastructure against breaches, zero-day vulnerabilities, and intrusions.',
    overview: 'Monitor network anomalies, audit code security, conduct penetration tests, and formulate incident response plans.',
    salaryRange: { min: 750000, max: 2200000, currency: 'INR' },
    demandLevel: 'HIGH' as const,
    growthRate: '+31% (Next 5 Years)',
  },
  {
    title: 'Management/MBA',
    slug: 'management-mba',
    category: 'Management',
    description: 'Lead engineering, product, strategy, and business teams in high-growth enterprises.',
    overview: 'Focus on strategic management, team leadership, financial acumen, marketing analysis, and product life cycles.',
    salaryRange: { min: 1000000, max: 3000000, currency: 'INR' },
    demandLevel: 'HIGH' as const,
    growthRate: '+14% (Next 5 Years)',
  },
  {
    title: 'Competitive Examination',
    slug: 'competitive-examination',
    category: 'Public Sector',
    description: 'Prepare for civil services, PSU, GATE, and state technical officer examinations.',
    overview: 'Master comprehensive core engineering domains, general studies, quantitative aptitude, and analytical reasoning.',
    salaryRange: { min: 700000, max: 1800000, currency: 'INR' },
    demandLevel: 'HIGH' as const,
    growthRate: '+10% (Stable)',
  },
];

export const SKILLS_SEED = [
  // Foundational
  { name: 'Programming Fundamentals', slug: 'programming-fundamentals', category: 'Core CS', level: 'FOUNDATIONAL' as const, tags: ['basics', 'syntax'] },
  { name: 'Data Structures & Algorithms', slug: 'dsa', category: 'Core CS', level: 'INTERMEDIATE' as const, tags: ['dsa', 'arrays', 'trees', 'graphs'] },
  { name: 'Object Oriented Programming', slug: 'oop', category: 'Core CS', level: 'FOUNDATIONAL' as const, tags: ['oop', 'classes', 'inheritance'] },
  { name: 'Operating Systems', slug: 'operating-systems', category: 'Core CS', level: 'INTERMEDIATE' as const, tags: ['os', 'threads', 'memory'] },
  { name: 'Computer Networks', slug: 'computer-networks', category: 'Core CS', level: 'INTERMEDIATE' as const, tags: ['tcp-ip', 'dns', 'http'] },
  { name: 'DBMS & Relational Theory', slug: 'dbms', category: 'Databases', level: 'FOUNDATIONAL' as const, tags: ['rdbms', 'acid', 'normalization'] },
  { name: 'SQL', slug: 'sql', category: 'Databases', level: 'INTERMEDIATE' as const, tags: ['sql', 'queries', 'joins', 'indexes'] },
  { name: 'System Design', slug: 'system-design', category: 'Architecture', level: 'ADVANCED' as const, tags: ['scalability', 'distributed', 'caching'] },
  { name: 'Linux CLI & Scripting', slug: 'linux', category: 'DevOps', level: 'FOUNDATIONAL' as const, tags: ['bash', 'cli', 'permissions'] },

  // Languages
  { name: 'Java', slug: 'java', category: 'Programming', level: 'INTERMEDIATE' as const, tags: ['jvm', 'java8', 'concurrency'] },
  { name: 'Python', slug: 'python', category: 'Programming', level: 'FOUNDATIONAL' as const, tags: ['python', 'scripting', 'data'] },
  { name: 'JavaScript', slug: 'javascript', category: 'Programming', level: 'FOUNDATIONAL' as const, tags: ['js', 'es6', 'async'] },
  { name: 'TypeScript', slug: 'typescript', category: 'Programming', level: 'INTERMEDIATE' as const, tags: ['ts', 'types', 'generics'] },

  // Backend
  { name: 'RESTful API Design', slug: 'rest-api', category: 'Backend', level: 'INTERMEDIATE' as const, tags: ['http', 'json', 'endpoints'] },
  { name: 'Spring Boot', slug: 'spring-boot', category: 'Backend', level: 'ADVANCED' as const, tags: ['java', 'spring', 'microservices'] },
  { name: 'Node.js & Express', slug: 'nodejs-express', category: 'Backend', level: 'INTERMEDIATE' as const, tags: ['event-loop', 'async', 'express'] },
  { name: 'Microservices Architecture', slug: 'microservices', category: 'Backend', level: 'ADVANCED' as const, tags: ['distributed', 'event-driven'] },

  // Cloud & DevOps
  { name: 'Git & Version Control', slug: 'git', category: 'DevOps', level: 'FOUNDATIONAL' as const, tags: ['git', 'github', 'branches'] },
  { name: 'Docker & Containerization', slug: 'docker', category: 'DevOps', level: 'INTERMEDIATE' as const, tags: ['containers', 'dockerfile', 'compose'] },
  { name: 'Kubernetes Orchestration', slug: 'kubernetes', category: 'DevOps', level: 'ADVANCED' as const, tags: ['k8s', 'pods', 'deployments'] },
  { name: 'Cloud Computing (AWS/GCP)', slug: 'cloud-computing', category: 'DevOps', level: 'INTERMEDIATE' as const, tags: ['aws', 's3', 'ec2', 'iam'] },

  // Data & ML
  { name: 'Data Analysis with Pandas', slug: 'pandas', category: 'Data & AI', level: 'INTERMEDIATE' as const, tags: ['dataframes', 'cleaning', 'python'] },
  { name: 'Applied Statistics & Probability', slug: 'statistics', category: 'Data & AI', level: 'FOUNDATIONAL' as const, tags: ['probability', 'hypothesis', 'math'] },
  { name: 'Machine Learning Fundamentals', slug: 'machine-learning', category: 'Data & AI', level: 'INTERMEDIATE' as const, tags: ['scikit-learn', 'supervised', 'models'] },

  // Security
  { name: 'Network Security & Firewalls', slug: 'network-security', category: 'Security', level: 'INTERMEDIATE' as const, tags: ['firewalls', 'vpn', 'packets'] },
  { name: 'Applied Cryptography', slug: 'cryptography', category: 'Security', level: 'ADVANCED' as const, tags: ['hashing', 'rsa', 'aes', 'tls'] },

  // Management & Aptitude
  { name: 'Quantitative Aptitude', slug: 'quantitative-aptitude', category: 'Aptitude', level: 'FOUNDATIONAL' as const, tags: ['arithmetic', 'algebra', 'speed-math'] },
  { name: 'Logical Reasoning', slug: 'logical-reasoning', category: 'Aptitude', level: 'FOUNDATIONAL' as const, tags: ['puzzles', 'deduction', 'critical-thinking'] },
  { name: 'Agile & Project Management', slug: 'project-management', category: 'Management', level: 'FOUNDATIONAL' as const, tags: ['scrum', 'jira', 'sprints'] },
];

export async function seedCareersAndSkills() {
  // 1. Seed Careers
  const careerMap = new Map<string, any>();
  for (const item of CAREERS_SEED) {
    const career = await Career.findOneAndUpdate(
      { slug: item.slug },
      { ...item, isActive: true },
      { upsert: true, new: true },
    );
    careerMap.set(item.slug, career);
  }

  // 2. Seed Skills
  const skillMap = new Map<string, any>();
  for (const item of SKILLS_SEED) {
    const skill = await Skill.findOneAndUpdate(
      { slug: item.slug },
      { ...item, isActive: true },
      { upsert: true, new: true },
    );
    skillMap.set(item.slug, skill);
  }

  // 3. Parent-Child Relations & Prerequisites
  const relations = [
    { parent: 'programming-fundamentals', child: 'dsa', type: 'PREREQUISITE' as const },
    { parent: 'programming-fundamentals', child: 'oop', type: 'PREREQUISITE' as const },
    { parent: 'programming-fundamentals', child: 'java', type: 'SUBCATEGORY' as const },
    { parent: 'programming-fundamentals', child: 'python', type: 'SUBCATEGORY' as const },
    { parent: 'programming-fundamentals', child: 'javascript', type: 'SUBCATEGORY' as const },
    { parent: 'javascript', child: 'typescript', type: 'PREREQUISITE' as const },
    { parent: 'javascript', child: 'nodejs-express', type: 'PREREQUISITE' as const },
    { parent: 'java', child: 'spring-boot', type: 'PREREQUISITE' as const },
    { parent: 'dbms', child: 'sql', type: 'SUBCATEGORY' as const },
    { parent: 'dsa', child: 'system-design', type: 'PREREQUISITE' as const },
    { parent: 'docker', child: 'kubernetes', type: 'PREREQUISITE' as const },
    { parent: 'docker', child: 'cloud-computing', type: 'RELATED' as const },
    { parent: 'python', child: 'pandas', type: 'PREREQUISITE' as const },
    { parent: 'statistics', child: 'machine-learning', type: 'PREREQUISITE' as const },
    { parent: 'computer-networks', child: 'network-security', type: 'PREREQUISITE' as const },
  ];

  for (const rel of relations) {
    const parent = skillMap.get(rel.parent);
    const child = skillMap.get(rel.child);
    if (parent && child) {
      await SkillRelation.findOneAndUpdate(
        { parentSkillId: parent._id, childSkillId: child._id, relationType: rel.type },
        { parentSkillId: parent._id, childSkillId: child._id, relationType: rel.type },
        { upsert: true },
      );
      // Link parentId on child if subcategory or prerequisite
      if (rel.type === 'SUBCATEGORY' && !child.parentId) {
        child.parentId = parent._id;
        await child.save();
      }
    }
  }

  // 4. Career Skill Mappings
  const careerSkillRequirements = [
    // Backend Developer
    { career: 'backend-developer', skill: 'dsa', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'backend-developer', skill: 'oop', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'backend-developer', skill: 'dbms', importance: 'CRITICAL' as const, weight: 4, proficiency: 4 },
    { career: 'backend-developer', skill: 'sql', importance: 'CRITICAL' as const, weight: 4, proficiency: 4 },
    { career: 'backend-developer', skill: 'rest-api', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'backend-developer', skill: 'spring-boot', importance: 'IMPORTANT' as const, weight: 4, proficiency: 3 },
    { career: 'backend-developer', skill: 'docker', importance: 'IMPORTANT' as const, weight: 3, proficiency: 3 },
    { career: 'backend-developer', skill: 'system-design', importance: 'CRITICAL' as const, weight: 5, proficiency: 3 },

    // Software Engineer
    { career: 'software-engineer', skill: 'dsa', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'software-engineer', skill: 'programming-fundamentals', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'software-engineer', skill: 'oop', importance: 'CRITICAL' as const, weight: 4, proficiency: 4 },
    { career: 'software-engineer', skill: 'git', importance: 'IMPORTANT' as const, weight: 4, proficiency: 3 },
    { career: 'software-engineer', skill: 'operating-systems', importance: 'IMPORTANT' as const, weight: 3, proficiency: 3 },
    { career: 'software-engineer', skill: 'computer-networks', importance: 'IMPORTANT' as const, weight: 3, proficiency: 3 },

    // Data Analyst
    { career: 'data-analyst', skill: 'sql', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'data-analyst', skill: 'python', importance: 'CRITICAL' as const, weight: 4, proficiency: 3 },
    { career: 'data-analyst', skill: 'pandas', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'data-analyst', skill: 'statistics', importance: 'CRITICAL' as const, weight: 4, proficiency: 3 },

    // Data/ML Engineer
    { career: 'data-ml-engineer', skill: 'python', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'data-ml-engineer', skill: 'statistics', importance: 'CRITICAL' as const, weight: 4, proficiency: 4 },
    { career: 'data-ml-engineer', skill: 'machine-learning', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'data-ml-engineer', skill: 'docker', importance: 'IMPORTANT' as const, weight: 4, proficiency: 3 },
    { career: 'data-ml-engineer', skill: 'cloud-computing', importance: 'IMPORTANT' as const, weight: 3, proficiency: 3 },

    // Cybersecurity Analyst
    { career: 'cybersecurity-analyst', skill: 'computer-networks', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'cybersecurity-analyst', skill: 'operating-systems', importance: 'CRITICAL' as const, weight: 4, proficiency: 4 },
    { career: 'cybersecurity-analyst', skill: 'network-security', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'cybersecurity-analyst', skill: 'cryptography', importance: 'IMPORTANT' as const, weight: 4, proficiency: 3 },
    { career: 'cybersecurity-analyst', skill: 'linux', importance: 'CRITICAL' as const, weight: 4, proficiency: 4 },

    // Management/MBA
    { career: 'management-mba', skill: 'quantitative-aptitude', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'management-mba', skill: 'logical-reasoning', importance: 'CRITICAL' as const, weight: 5, proficiency: 4 },
    { career: 'management-mba', skill: 'project-management', importance: 'CRITICAL' as const, weight: 4, proficiency: 4 },

    // Competitive Examination
    { career: 'competitive-examination', skill: 'quantitative-aptitude', importance: 'CRITICAL' as const, weight: 5, proficiency: 5 },
    { career: 'competitive-examination', skill: 'logical-reasoning', importance: 'CRITICAL' as const, weight: 5, proficiency: 5 },
    { career: 'competitive-examination', skill: 'operating-systems', importance: 'IMPORTANT' as const, weight: 4, proficiency: 4 },
    { career: 'competitive-examination', skill: 'computer-networks', importance: 'IMPORTANT' as const, weight: 4, proficiency: 4 },
    { career: 'competitive-examination', skill: 'dbms', importance: 'IMPORTANT' as const, weight: 4, proficiency: 4 },
  ];

  for (const mapping of careerSkillRequirements) {
    const career = careerMap.get(mapping.career);
    const skill = skillMap.get(mapping.skill);
    if (career && skill) {
      await CareerSkill.findOneAndUpdate(
        { careerId: career._id, skillId: skill._id },
        {
          careerId: career._id,
          skillId: skill._id,
          importance: mapping.importance,
          weight: mapping.weight,
          requiredProficiency: mapping.proficiency,
        },
        { upsert: true },
      );
    }
  }

  logger.info(`Seeded ${CAREERS_SEED.length} careers and ${SKILLS_SEED.length} skills with relationships and career mappings.`);
}
