export interface AdminComparisonStats {
  total: number;
  completed: number;
  partial: number;
  failed: number;
  pending: number;
  today: number;
  avg_response_time_ms: number | null;
}

export interface AdminModelSelection {
  model_id: string;
  model_name_ar: string;
  provider_key: string;
  selection_count: number;
}

export interface AdminProviderExecution {
  provider_key: string;
  provider_name_ar: string;
  selection_count: number;
  success_count: number;
  error_count: number;
  success_rate: number | null;
  avg_response_time_ms: number | null;
}

export interface AdminVotePreference {
  model_id: string;
  model_name_ar: string;
  provider_key: string;
  vote_count: number;
}

export interface AdminRecentError {
  occurred_at: string;
  provider_key: string | null;
  provider_name_ar: string | null;
  model_name_ar: string | null;
  error_message_ar: string | null;
  error_code: string | null;
  request_id: string | null;
}

export interface AdminRecentActivity {
  occurred_at: string;
  activity_type: string;
  status: string;
}

export interface AdminUploadStats {
  total: number;
  today: number;
  images: number;
  pdfs: number;
}

export interface AdminStatsData {
  comparisons: AdminComparisonStats;
  uploads: AdminUploadStats;
  total_votes: number;
  most_selected_models: AdminModelSelection[];
  provider_execution: AdminProviderExecution[];
  vote_preferences: AdminVotePreference[];
  recent_errors: AdminRecentError[];
  recent_activity: AdminRecentActivity[];
}
