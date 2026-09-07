import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';

export interface IngestDocumentInput {
  resourceId: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface IngestDocumentOutput {
  documentId: string;
  chunksCount: number;
}

export interface SearchKnowledgeInput {
  query: string;
  filters?: {
    college?: string;
    subject?: string;
    skillId?: string;
  };
  limit?: number;
}

export interface KnowledgeRetrievalEngine {
  ingestDocument(input: IngestDocumentInput): Promise<IngestDocumentOutput>;
  searchKnowledge(input: SearchKnowledgeInput): Promise<any[]>;
  generateGroundedAnswer(
    query: string,
    contextDocuments: any[],
  ): Promise<{ answer: string; citations: string[] }>;
}

/**
 * Controlled implementation returning AI_NOT_ENABLED per FRD specifications.
 * Never fabricates AI answers.
 */
export class UnimplementedKnowledgeRetrievalEngine
  implements KnowledgeRetrievalEngine
{
  async ingestDocument(_input: IngestDocumentInput): Promise<IngestDocumentOutput> {
    throw new AppError(
      501,
      ErrorCode.AI_NOT_ENABLED,
      'AI/RAG ingestion service is not enabled in this deployment.',
    );
  }

  async searchKnowledge(_input: SearchKnowledgeInput): Promise<any[]> {
    throw new AppError(
      501,
      ErrorCode.AI_NOT_ENABLED,
      'AI/RAG semantic search service is not enabled in this deployment.',
    );
  }

  async generateGroundedAnswer(
    _query: string,
    _contextDocuments: any[],
  ): Promise<{ answer: string; citations: string[] }> {
    throw new AppError(
      501,
      ErrorCode.AI_NOT_ENABLED,
      'AI/RAG answer generation service is not enabled in this deployment.',
    );
  }
}

export const knowledgeRetrievalEngine: KnowledgeRetrievalEngine =
  new UnimplementedKnowledgeRetrievalEngine();
