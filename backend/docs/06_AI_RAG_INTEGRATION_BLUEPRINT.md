# CareerGraph — AI/RAG Integration Blueprint

## 1. Design Philosophy
CareerGraph follows a **clean interface abstraction pattern** for all future Machine Learning, Large Language Model (LLM), and Retrieval-Augmented Generation (RAG) capabilities.

The codebase strictly decouples business domain services from AI generation:
1. **Never fake or hallucinate scores**: Where AI is not yet connected, endpoints respond with HTTP 501 `AI_NOT_ENABLED` rather than mocked or randomized AI predictions.
2. **Deterministic Fallbacks**: Deterministic engines (e.g. word-boundary keyword extraction in Job Analyzer, objective MCQ scoring in Assessments, graph-traversal in Roadmaps) operate autonomously without requiring external AI APIs.
3. **Pluggable Architecture**: Concrete engine interfaces allow plugging in LangChain, LlamaIndex, OpenAI, Anthropic, or local HuggingFace/vLLM instances without altering controller or route signatures.

---

## 2. Defined AI Engine Interfaces
All interfaces are housed within their respective modules:

### A. Recommendation Engine (`RecommendationEngine`)
- **Location**: `src/modules/resources/recommendation.interface.ts`
- **Method**:
  ```ts
  interface RecommendationEngine {
    recommendResources(studentId: string, careerGoalId?: string): Promise<ResourceRecommendation[]>;
  }
  ```
- **Target Implementation**: Embedding student skill state vectors and target career skill gaps to recommend optimal learning resources via cosine similarity.

### B. Knowledge Retrieval / RAG Engine (`KnowledgeRetrievalEngine`)
- **Location**: `src/modules/resources/knowledge-retrieval.interface.ts`
- **Methods**:
  ```ts
  interface KnowledgeRetrievalEngine {
    search(query: string, filter?: Record<string, any>): Promise<RetrievalResult[]>;
    ask(question: string, contextFilter?: Record<string, any>): Promise<RagAnswer>;
  }
  ```
- **Endpoints**:
  - `POST /api/v1/resources/knowledge/search` -> Returns 501 `AI_NOT_ENABLED` until vector database (Pinecone/Milvus/Qdrant) is connected.
  - `POST /api/v1/resources/knowledge/ask` -> Returns 501 `AI_NOT_ENABLED` until LLM orchestrator is initialized.

### C. Semantic Matching Engine (`SemanticMatchingEngine`)
- **Location**: `src/modules/jobs/semantic-matching.interface.ts`
- **Method**:
  ```ts
  interface SemanticMatchingEngine {
    matchJobToProfile(jobDescription: string, studentProfile: StudentProfileData): Promise<SemanticMatchResult>;
  }
  ```
- **Endpoints**:
  - `POST /api/v1/job-analyses/semantic/match` -> Returns 501 `AI_NOT_ENABLED`.
  - Fallback: Deterministic `POST /api/v1/job-analyses/:id/analyze` extracts skills via regex boundary matching against the 36+ taxonomy skills in `skills` collection.

---

## 3. Future Integration Roadmap
```
+------------------------------------------------------------------+
|                        API Controller Layer                      |
+------------------------------------------------------------------+
                                  |
                                  v
+------------------------------------------------------------------+
|                    Engine Adapter Layer                          |
|  (DefaultDisabledEngine -> LocalLLMEngine / LangChainService)    |
+------------------------------------------------------------------+
          |                                       |
          v                                       v
+-------------------+                   +-------------------+
|   Vector DB       |                   |      LLM Host     |
| (Qdrant / Milvus) |                   |  (Gemini / OpenAI)|
+-------------------+                   +-------------------+
```
1. **Vector Storage**: Chunk PDF notes and syllabus documents uploaded by Faculty into 512-token chunks and store embeddings in a vector index.
2. **Hybrid Search**: Combine MongoDB full-text index with dense vector embeddings for hybrid BM25 + dense retrieval.
3. **Interview Audio Evaluation**: Connect Whisper API or Google Speech-to-Text to transcribe student audio answers before passing transcripts to the rubric scorer.
