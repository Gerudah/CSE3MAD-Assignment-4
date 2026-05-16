export interface Session {
  id: string;
  team_id: string;
  activity_id: string;
  started_at: number;
  completed_at: number | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  group_reflection: string | null;
}

export interface Prototype {
  id: string;
  session_id: string;
  prototype_number: number;
  design_description: string | null;
  created_at: number;
}

export interface Measurement {
  id: string;
  prototype_id: string;
  metric_key: string;
  value: number;
  unit: string;
  phase: string | null;
  recorded_at: number;
}

export interface SensorReading {
  id: string;
  prototype_id: string;
  sensor_type: string;
  value_x: number | null;
  value_y: number | null;
  value_z: number | null;
  sampled_at: number;
}

export interface ActivityRating {
  id: string;
  session_id: string;
  student_id: string;
  stars: number;
  comment: string | null;
  created_at: number;
}

export interface MediaUpload {
  id: string;
  prototype_id: string;
  student_id: string;
  media_type: string;
  local_uri: string;
  storage_url: string | null;
  capture_mode: string | null;
  duration_seconds: number | null;
  uploaded_at: number;
}
