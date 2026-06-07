export interface ApiMeta {
  request_id?: string | null;
  sort?: string | null;
  generated_at?: string | null;
  min_selection?: number | null;
  max_selection?: number | null;
  default_key?: string | null;
  supports_auto_detect?: boolean | null;
  coming_soon_ar?: string | null;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string | null;
  issue?: string | null;
  min?: number | null;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  message_en: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
  meta?: ApiMeta;
}

export interface ProviderRef {
  key: string;
  name_ar: string;
}

export interface Category {
  id: string;
  key: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
}

export interface CategoryResolved extends Category {
  source: string;
  confidence?: number | null;
}

export interface Model {
  id: string;
  key: string;
  name_ar: string;
  name_en?: string | null;
  provider: ProviderRef;
  is_placeholder: boolean;
  max_tokens: number;
  status_ar?: string | null;
}

export interface PromptRef {
  id: string;
  content?: string | null;
  char_count?: number | null;
}

export interface TargetRef {
  model_id: string;
  position: number;
}

export interface ResponseItem {
  id: string;
  model: Model | null;
  content: string | null;
  response_time_ms: number | null;
  status: string;
  error_message_ar?: string | null;
}

export interface VoteRef {
  response_id: string;
  created_at: string;
}

export interface Comparison {
  id: string;
  status: string;
  prompt: PromptRef;
  category: CategoryResolved;
  targets: TargetRef[];
  responses: ResponseItem[];
  vote: VoteRef | null;
  created_at: string;
  completed_at?: string | null;
}

export interface ComparisonCreated {
  id: string;
  status: string;
  prompt: PromptRef;
  category: CategoryResolved;
  targets: TargetRef[];
  created_at: string;
}

export interface PreferenceItem {
  model_id: string;
  model_key: string;
  name_ar: string;
  provider_key: string;
  vote_count: number;
  preference_share_pct: number;
}

export interface PreferencesData {
  scope: string;
  category: Category | null;
  disclaimer_ar: string;
  disclaimer_en?: string | null;
  period: string;
  total_votes: number;
  preferences: PreferenceItem[];
}

export interface CategorySummaryItem {
  category: Category;
  total_votes: number;
  preferences: PreferenceItem[];
}

export interface PreferencesSummaryData {
  period: string;
  overall: PreferencesData;
  by_category: CategorySummaryItem[];
}

export interface Vote {
  id: string;
  comparison_id: string;
  response_id: string;
  created_at: string;
}

export interface CategoryDetectResult {
  suggested_category: Category;
  confidence: number;
  fallback_used: boolean;
}

export interface CreateComparisonPayload {
  prompt: string;
  category_mode: "manual" | "auto";
  category_key?: string;
  model_ids: string[];
}

export interface SessionData {
  session_id: string;
  expires_at: string;
}
