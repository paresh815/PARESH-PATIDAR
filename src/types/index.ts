export interface UserEntity {
  id: number;
  name: string;
  username: string;
  password_hash: string;
  salt: string;
  created_at: string;
  active: boolean;
  notes?: string;
  total_connections: number;
  last_connected_at: string | null;
}

export interface ConnectionLogEntity {
  id: number;
  user_id: number;
  username: string;
  device_name: string;
  ip_address: string;
  mac_address?: string;
  user_agent?: string;
  connected_at: string;
  disconnected_at: string | null;
  status: 'connected' | 'disconnected' | 'timed_out' | 'kicked';
  bytes_in: number;
  bytes_out: number;
}

export interface LoginAttemptEntity {
  id: number;
  username: string;
  ip_address: string;
  device_info: string;
  timestamp: string;
  success: boolean;
  failure_reason?: string;
}

export interface ServerStatus {
  isRunning: boolean;
  port: number;
  gatewayIp: string;
  ssid: string;
  uptimeSeconds: number;
  activeCount: number;
}

export interface AndroidFileStructure {
  path: string;
  filename: string;
  language: 'kotlin' | 'xml' | 'gradle' | 'markdown' | 'properties';
  category: 'ui' | 'data' | 'server' | 'security' | 'config' | 'docs';
  content: string;
  description: string;
}
