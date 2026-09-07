import {
  RecommendationEngine,
  GenerateRoadmapInput,
  GeneratedStepPlan,
} from './recommendation-engine.interface';
import { CareerSkill } from '@/models/CareerSkill.model';
import { StudentSkill } from '@/models/StudentSkill.model';
import { SkillRelation } from '@/models/SkillRelation.model';

export class RuleBasedRecommendationEngine implements RecommendationEngine {
  async generateStepPlan(input: GenerateRoadmapInput): Promise<GeneratedStepPlan[]> {
    const { userId, careerId, targetRole } = input;

    // 1. Fetch career skills
    const careerSkills = await CareerSkill.find({ careerId })
      .populate('skillId')
      .lean();

    // 2. Fetch student skills
    const studentSkills = await StudentSkill.find({ userId }).lean();
    const studentSkillMap = new Map<string, number>();
    for (const ss of studentSkills) {
      studentSkillMap.set(ss.skillId.toString(), ss.proficiency);
    }

    // 3. Identify gaps (or skills to advance)
    let candidateSkills = careerSkills.filter((cs: any) => {
      const sId = cs.skillId?._id?.toString() || cs.skillId?.toString();
      const curr = studentSkillMap.get(sId) ?? 0;
      return curr < cs.requiredProficiency;
    });

    // If student has already reached required proficiency for all skills, include all career skills
    if (candidateSkills.length === 0) {
      candidateSkills = careerSkills;
    }

    const candidateSkillIds = candidateSkills
      .map((cs: any) => cs.skillId?._id)
      .filter(Boolean);

    // 4. Fetch prerequisite relationships among candidate skills
    const relations = await SkillRelation.find({
      parentSkillId: { $in: candidateSkillIds },
      childSkillId: { $in: candidateSkillIds },
      relationType: { $in: ['PREREQUISITE', 'SUBCATEGORY'] },
    }).lean();

    // Build dependency graph: child depends on parent (parent must come first)
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const cs of candidateSkills) {
      const sId = (cs.skillId?._id || cs.skillId).toString();
      inDegree.set(sId, 0);
      dependents.set(sId, []);
    }

    for (const rel of relations) {
      const parentId = rel.parentSkillId.toString();
      const childId = rel.childSkillId.toString();
      if (dependents.has(parentId) && inDegree.has(childId)) {
        dependents.get(parentId)!.push(childId);
        inDegree.set(childId, (inDegree.get(childId) || 0) + 1);
      }
    }

    // Priority comparator for ties: CRITICAL > IMPORTANT > NICE_TO_HAVE, then weight desc
    const importanceScore: Record<string, number> = {
      CRITICAL: 3,
      IMPORTANT: 2,
      NICE_TO_HAVE: 1,
    };

    const skillObjMap = new Map<string, any>();
    for (const cs of candidateSkills) {
      const sId = (cs.skillId?._id || cs.skillId).toString();
      skillObjMap.set(sId, cs);
    }

    const sortQueue = (queue: string[]) => {
      queue.sort((a, b) => {
        const csA = skillObjMap.get(a);
        const csB = skillObjMap.get(b);
        const scoreA = importanceScore[csA?.importance] || 0;
        const scoreB = importanceScore[csB?.importance] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (csB?.weight || 0) - (csA?.weight || 0);
      });
    };

    // Topological Sort (Kahn's algorithm)
    const queue: string[] = [];
    for (const [sId, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(sId);
    }
    sortQueue(queue);

    const orderedSkillIds: string[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      orderedSkillIds.push(curr);

      const children = dependents.get(curr) || [];
      for (const ch of children) {
        const deg = (inDegree.get(ch) || 0) - 1;
        inDegree.set(ch, deg);
        if (deg === 0) {
          queue.push(ch);
        }
      }
      sortQueue(queue);
    }

    // Include any nodes in cycles
    for (const cs of candidateSkills) {
      const sId = (cs.skillId?._id || cs.skillId).toString();
      if (!orderedSkillIds.includes(sId)) {
        orderedSkillIds.push(sId);
      }
    }

    // 5. Generate step plans
    const stepPlans: GeneratedStepPlan[] = [];

    for (const sId of orderedSkillIds) {
      const cs = skillObjMap.get(sId);
      const skill = cs.skillId;
      const currentProficiency = studentSkillMap.get(sId) ?? 0;
      const targetProficiency = cs.requiredProficiency || 3;
      const gap = Math.max(1, targetProficiency - currentProficiency);

      // Find prerequisite skill IDs for this skill
      const prereqRelations = relations.filter(
        (r) => r.childSkillId.toString() === sId,
      );
      const prerequisiteSkillIds = prereqRelations.map((r) => r.parentSkillId);

      stepPlans.push({
        skillId: skill._id,
        title: `Master ${skill.name}`,
        description: `Advance ${skill.name} from level ${currentProficiency} to target level ${targetProficiency} for role: ${targetRole}.`,
        currentProficiency,
        targetProficiency,
        estimatedHours: gap * 15,
        prerequisiteSkillIds,
      });
    }

    return stepPlans;
  }
}

export const ruleBasedRecommendationEngine = new RuleBasedRecommendationEngine();
