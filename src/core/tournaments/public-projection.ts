export const PUBLIC_TOURNAMENT_FIELDS = [
  "id",
  "slug",
  "name",
  "description",
  "visibility",
  "status",
  "starts_at",
  "ends_at",
  "registration_opens_at",
  "registration_closes_at",
  "organization_id",
  "created_at",
] as const;

export const PUBLIC_ENTRY_FIELDS = [
  "id",
  "tournament_id",
  "entry_number",
  "team_id",
  "tournament_boat_id",
  "display_name",
] as const;

export const PUBLIC_CATCH_FIELDS = [
  "id",
  "tournament_id",
  "tournament_entry_id",
  "species_id",
  "weight_g",
  "length_mm",
  "captured_at_device",
  "state",
  "public_photo_path",
] as const;

export const PUBLIC_LEADERBOARD_FIELDS = [
  "tournament_id",
  "tournament_entry_id",
  "division_id",
  "rank",
  "score_numeric",
  "eligible_catch_count",
  "is_disqualified",
  "computed_at",
] as const;

export const PRIVATE_FIELD_NAMES = [
  "latitude",
  "longitude",
  "lat",
  "lng",
  "gps_accuracy_m",
  "device_id",
  "device_metadata",
  "original_metadata",
  "fair_play_signal",
  "verification_detail",
  "email",
  "claim_token_hash",
  "wallet_address",
  "payment_provider_id",
  "registration_number",
  "contact_phone",
  "internal_notes",
] as const;

export function containsPrivateField(fields: readonly string[]): boolean {
  const normalized = new Set(fields.map((field) => field.toLowerCase()));
  return PRIVATE_FIELD_NAMES.some((field) => normalized.has(field));
}
