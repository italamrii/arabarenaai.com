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

export interface AdminProviderUsage {
  provider_key: string;
  provider_name_ar: string;
  usage_count: number;
}

export interface AdminCostByProvider {
  provider_key: string;
  provider_name_ar: string;
  estimated_cost_usd: number | null;
  input_tokens: number;
  output_tokens: number;
  response_count: number;
}

export interface AdminCostByModel {
  model_key: string;
  model_name_ar: string;
  provider_key: string;
  estimated_cost_usd: number | null;
  input_tokens: number;
  output_tokens: number;
  response_count: number;
}

export interface AdminMissingPricingModel {
  model_key: string;
  model_name_ar: string;
  provider_key: string;
}

export interface AdminMostExpensive {
  provider_key: string | null;
  provider_name_ar: string | null;
  model_key: string | null;
  model_name_ar: string | null;
  estimated_cost_usd: number | null;
}

export interface AdminCostTracking {
  estimated_cost_today_usd: number | null;
  estimated_cost_month_usd: number | null;
  input_tokens_today: number | null;
  output_tokens_today: number | null;
  input_tokens_month: number | null;
  output_tokens_month: number | null;
  cost_by_provider_today: AdminCostByProvider[];
  cost_by_model_today: AdminCostByModel[];
  most_expensive_provider_today: AdminMostExpensive | null;
  most_expensive_model_today: AdminMostExpensive | null;
  average_cost_per_comparison_today: number | null;
  comparisons_with_cost_today: number | null;
  missing_pricing_models: AdminMissingPricingModel[];
}

export interface AdminUsageSignals {
  online_now_5m: number | null;
  active_sessions_15m: number | null;
  visitors_today: number | null;
  comparisons_today: number | null;
  votes_today: number | null;
  uploads_today: number | null;
  attachments_today: number | null;
  model_responses_today: number | null;
  most_used_models_today: AdminModelSelection[];
  most_used_providers_today: AdminProviderUsage[];
  failed_comparisons_today: number | null;
  average_response_time_today: number | null;
  total_input_tokens_today: number | null;
  total_output_tokens_today: number | null;
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
  usage_signals: AdminUsageSignals;
  cost_tracking: AdminCostTracking;
}
