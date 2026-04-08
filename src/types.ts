// ============================================
// Phase 1: フロントエンドデザインループ用の型
// ============================================

export interface CriterionScore {
  score: number; // 1-10
  feedback: string;
}

export interface DesignEvaluation {
  iteration: number;
  scores: {
    designQuality: CriterionScore;
    originality: CriterionScore;
    technical: CriterionScore;
    functionality: CriterionScore;
  };
  averageScore: number;
  passed: boolean;
  criticalIssues: string[];
  strengths: string[];
  overallFeedback: string;
}

export interface DesignLoopConfig {
  maxIterations: number;
  passThreshold: number; // avg score >= this to pass
  earlyExit: boolean; // true: 合格で即終了、false: 全回実行してベスト採用
  model?: string;
  outputDir: string;
}

export const DEFAULT_DESIGN_CONFIG: DesignLoopConfig = {
  maxIterations: 10,
  passThreshold: 7.0,
  earlyExit: false,
  outputDir: "output",
};

// ============================================
// Phase 2: フルスタック3エージェント用の型
// ============================================

export interface Sprint {
  id: number;
  name: string;
  description: string;
  features: string[];
}

export interface SprintContract {
  sprintId: number;
  scope: string; // what will be built
  testCriteria: string[]; // specific testable behaviors
  acceptanceCriteria: string[]; // what "done" looks like
  agreedAt: string; // ISO timestamp
}

export interface DesignLanguage {
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    additionalColors?: string[];
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont?: string;
  };
  spacing: string; // e.g., "8px grid system"
  borderRadius: string; // e.g., "rounded-lg (8px)"
  visualIdentity: string; // 1-2 sentence description of the visual mood/style
  inspirations?: string[]; // reference sites or styles
}

export interface ProductSpec {
  title: string;
  description: string;
  techStack: {
    frontend: string;
    backend: string;
    database?: string;
  };
  designLanguage?: DesignLanguage;
  sprints: Sprint[];
}

export interface QACriterionScore {
  score: number; // 1-10
  feedback: string;
}

export interface QAEvaluation {
  sprintId: number;
  attempt: number;
  scores: {
    productDepth: QACriterionScore;
    functionality: QACriterionScore;
    visualDesign: QACriterionScore;
    codeQuality: QACriterionScore;
  };
  averageScore: number;
  passed: boolean;
  criticalIssues: string[];
  strengths: string[];
  overallFeedback: string;
}

export interface FullstackLoopConfig {
  maxSprintRetries: number;
  passThreshold: number;
  model?: string;
  outputDir: string;
}

export const DEFAULT_FULLSTACK_CONFIG: FullstackLoopConfig = {
  maxSprintRetries: 3,
  passThreshold: 7.0,
  outputDir: "output",
};

// ============================================
// 共通
// ============================================

export interface AgentResult {
  result: string;
  cost?: number;
}

export interface LoopSummary {
  totalIterations: number;
  totalCost: number;
  finalScore?: number;
  passed: boolean;
}
