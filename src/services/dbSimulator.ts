import { UserEntity, ConnectionLogEntity, LoginAttemptEntity, ServerStatus } from '../types';
import { hashPasswordSha256, generateSalt } from '../utils/crypto';

const STORAGE_KEY_USERS = 'hotspot_auth_users';
const STORAGE_KEY_LOGS = 'hotspot_auth_logs';
const STORAGE_KEY_ATTEMPTS = 'hotspot_auth_attempts';
const STORAGE_KEY_SERVER = 'hotspot_auth_server';
const STORAGE_KEY_ADMIN_PIN = 'hotspot_admin_pin';

type Listener = () => void;

class HotspotDbSimulator {
  private users: UserEntity[] = [];
  private logs: ConnectionLogEntity[] = [];
  private attempts: LoginAttemptEntity[] = [];
  private listeners: Set<Listener> = new Set();
  private serverStatus: ServerStatus = {
    isRunning: true,
    port: 8080,
    gatewayIp: '192.168.43.1',
    ssid: 'AndroidAP_SecureAuth',
    uptimeSeconds: 3420,
    activeCount: 0,
  };
  private adminPin: string = '1234';
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
    this.startUptimeTracker();
  }

  private startUptimeTracker() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.serverStatus.isRunning) {
        this.serverStatus.uptimeSeconds += 1;
        // Simulate minor random traffic on active connections
        let changed = false;
        this.logs.forEach(log => {
          if (log.status === 'connected') {
            log.bytes_in += Math.floor(Math.random() * 8000) + 1024;
            log.bytes_out += Math.floor(Math.random() * 3000) + 512;
            changed = true;
          }
        });
        if (changed) {
          this.saveLogs();
        }
        this.notify();
      }
    }, 1000);
  }

  private async init() {
    const savedPin = localStorage.getItem(STORAGE_KEY_ADMIN_PIN);
    if (savedPin) this.adminPin = savedPin;

    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    const rawLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    const rawAttempts = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    const rawServer = localStorage.getItem(STORAGE_KEY_SERVER);

    if (rawServer) {
      try {
        const parsed = JSON.parse(rawServer);
        this.serverStatus = { ...this.serverStatus, ...parsed };
      } catch (e) {
        console.error(e);
      }
    }

    if (rawUsers) {
      try {
        this.users = JSON.parse(rawUsers);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default users mentioned in user prompt
      await this.seedDefaultUsers();
    }

    if (rawLogs) {
      try {
        this.logs = JSON.parse(rawLogs);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.seedDefaultLogs();
    }

    if (rawAttempts) {
      try {
        this.attempts = JSON.parse(rawAttempts);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.seedDefaultAttempts();
    }

    this.updateActiveCount();
    this.notify();
  }

  private async seedDefaultUsers() {
    const now = new Date();
    const subHours = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

    const saltRahul = generateSalt();
    const hashRahul = await hashPasswordSha256('RAHUL123', saltRahul);

    const saltAmit = generateSalt();
    const hashAmit = await hashPasswordSha256('AMIT456', saltAmit);

    const saltMohan = generateSalt();
    const hashMohan = await hashPasswordSha256('MOHAN789', saltMohan);

    const saltPriya = generateSalt();
    const hashPriya = await hashPasswordSha256('PRIYA999', saltPriya);

    this.users = [
      {
        id: 1,
        name: 'Rahul Sharma',
        username: 'rahul',
        password_hash: hashRahul,
        salt: saltRahul,
        created_at: subHours(48),
        active: true,
        notes: 'Friend / Daily hotspot user',
        total_connections: 12,
        last_connected_at: subHours(1),
      },
      {
        id: 2,
        name: 'Amit Kumar',
        username: 'amit',
        password_hash: hashAmit,
        salt: saltAmit,
        created_at: subHours(72),
        active: true,
        notes: 'Colleague / Study group',
        total_connections: 8,
        last_connected_at: subHours(3),
      },
      {
        id: 3,
        name: 'Mohan Lal',
        username: 'mohan',
        password_hash: hashMohan,
        salt: saltMohan,
        created_at: subHours(96),
        active: false,
        notes: 'Temporary access (Deactivated)',
        total_connections: 4,
        last_connected_at: subHours(24),
      },
      {
        id: 4,
        name: 'Priya Patel',
        username: 'priya',
        password_hash: hashPriya,
        salt: saltPriya,
        created_at: subHours(12),
        active: true,
        notes: 'Laptop & Tablet access',
        total_connections: 5,
        last_connected_at: subHours(5),
      }
    ];
    this.saveUsers();
  }

  private seedDefaultLogs() {
    const now = new Date();
    const subMinutes = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

    this.logs = [
      {
        id: 101,
        user_id: 1,
        username: 'rahul',
        device_name: 'Samsung Galaxy S23 (SM-S911B)',
        ip_address: '192.168.43.142',
        mac_address: 'd4:3a:28:9f:12:4b',
        user_agent: 'Mozilla/5.0 (Linux; Android 14; SM-S911B)',
        connected_at: subMinutes(45),
        disconnected_at: null,
        status: 'connected',
        bytes_in: 45200000,
        bytes_out: 12400000,
      },
      {
        id: 102,
        user_id: 2,
        username: 'amit',
        device_name: 'OnePlus 11 5G (CPH2449)',
        ip_address: '192.168.43.88',
        mac_address: '8c:7a:3d:e1:90:5a',
        user_agent: 'Mozilla/5.0 (Linux; Android 13; CPH2449)',
        connected_at: subMinutes(120),
        disconnected_at: subMinutes(20),
        status: 'disconnected',
        bytes_in: 128400000,
        bytes_out: 18900000,
      },
      {
        id: 103,
        user_id: 4,
        username: 'priya',
        device_name: 'Apple iPhone 15 Pro (iOS 17.4)',
        ip_address: '192.168.43.205',
        mac_address: 'fe:19:45:aa:bb:cc',
        user_agent: 'CaptiveNetworkSupport/1.0 (17.4.1)',
        connected_at: subMinutes(280),
        disconnected_at: subMinutes(90),
        status: 'disconnected',
        bytes_in: 92100000,
        bytes_out: 14200000,
      }
    ];
    this.saveLogs();
  }

  private seedDefaultAttempts() {
    const now = new Date();
    const subMinutes = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

    this.attempts = [
      {
        id: 1,
        username: 'rahul',
        ip_address: '192.168.43.142',
        device_info: 'Samsung Galaxy S23 (SM-S911B)',
        timestamp: subMinutes(45),
        success: true,
      },
      {
        id: 2,
        username: 'mohan',
        ip_address: '192.168.43.190',
        device_info: 'Redmi Note 12 Pro',
        timestamp: subMinutes(35),
        success: false,
        failure_reason: 'User account is deactivated by admin',
      },
      {
        id: 3,
        username: 'unknown_guest',
        ip_address: '192.168.43.210',
        device_info: 'Realme GT Neo 3',
        timestamp: subMinutes(30),
        success: false,
        failure_reason: 'Invalid username: user does not exist',
      },
      {
        id: 4,
        username: 'amit',
        ip_address: '192.168.43.88',
        device_info: 'OnePlus 11 5G (CPH2449)',
        timestamp: subMinutes(125),
        success: false,
        failure_reason: 'Incorrect password attempt',
      },
      {
        id: 5,
        username: 'amit',
        ip_address: '192.168.43.88',
        device_info: 'OnePlus 11 5G (CPH2449)',
        timestamp: subMinutes(120),
        success: true,
      }
    ];
    this.saveAttempts();
  }

  private saveUsers() {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
  }

  private saveLogs() {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
  }

  private saveAttempts() {
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(this.attempts));
  }

  private saveServer() {
    localStorage.setItem(STORAGE_KEY_SERVER, JSON.stringify(this.serverStatus));
  }

  private updateActiveCount() {
    this.serverStatus.activeCount = this.logs.filter(l => l.status === 'connected').length;
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  // Getters
  public getUsers(): UserEntity[] {
    return [...this.users];
  }

  public getLogs(): ConnectionLogEntity[] {
    return [...this.logs].sort((a, b) => new Date(b.connected_at).getTime() - new Date(a.connected_at).getTime());
  }

  public getAttempts(): LoginAttemptEntity[] {
    return [...this.attempts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getServerStatus(): ServerStatus {
    return { ...this.serverStatus };
  }

  public getAdminPin(): string {
    return this.adminPin;
  }

  public setAdminPin(newPin: string) {
    this.adminPin = newPin;
    localStorage.setItem(STORAGE_KEY_ADMIN_PIN, newPin);
    this.notify();
  }

  public toggleServer(running?: boolean) {
    this.serverStatus.isRunning = running !== undefined ? running : !this.serverStatus.isRunning;
    this.saveServer();
    this.notify();
  }

  // User CRUD
  public async createUser(data: { name: string; username: string; password_plaintext: string; notes?: string; active?: boolean }): Promise<UserEntity> {
    const cleanUsername = data.username.trim().toLowerCase();
    if (this.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      throw new Error(`Username "${data.username}" already exists!`);
    }

    const salt = generateSalt();
    const hash = await hashPasswordSha256(data.password_plaintext, salt);

    const newUser: UserEntity = {
      id: Date.now(),
      name: data.name.trim(),
      username: cleanUsername,
      password_hash: hash,
      salt: salt,
      created_at: new Date().toISOString(),
      active: data.active !== false,
      notes: data.notes || '',
      total_connections: 0,
      last_connected_at: null,
    };

    this.users.unshift(newUser);
    this.saveUsers();
    this.notify();
    return newUser;
  }

  public async updateUser(id: number, data: { name?: string; notes?: string; active?: boolean; new_password_plaintext?: string }) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.notes !== undefined) user.notes = data.notes;
    if (data.active !== undefined) user.active = data.active;

    if (data.new_password_plaintext && data.new_password_plaintext.trim().length > 0) {
      const salt = generateSalt();
      user.password_hash = await hashPasswordSha256(data.new_password_plaintext.trim(), salt);
      user.salt = salt;
    }

    this.saveUsers();
    this.notify();
    return user;
  }

  public toggleUserActive(id: number): boolean {
    const user = this.users.find(u => u.id === id);
    if (!user) return false;
    user.active = !user.active;
    
    // If deactivated, disconnect any active connections for this user
    if (!user.active) {
      this.logs.forEach(log => {
        if (log.user_id === user.id && log.status === 'connected') {
          log.status = 'kicked';
          log.disconnected_at = new Date().toISOString();
        }
      });
      this.saveLogs();
      this.updateActiveCount();
    }

    this.saveUsers();
    this.notify();
    return user.active;
  }

  public deleteUser(id: number) {
    this.users = this.users.filter(u => u.id !== id);
    this.saveUsers();
    this.notify();
  }

  // Hotspot Authentication Core Logic (Called by Captive Portal Login Form)
  public async authenticateClient(credentials: {
    username: string;
    password_plaintext: string;
    ip_address: string;
    device_name: string;
    mac_address?: string;
    user_agent?: string;
  }): Promise<{ success: boolean; message: string; user?: UserEntity; session?: ConnectionLogEntity }> {
    const cleanUsername = credentials.username.trim().toLowerCase();
    const now = new Date().toISOString();

    if (!this.serverStatus.isRunning) {
      const attempt: LoginAttemptEntity = {
        id: Date.now(),
        username: cleanUsername,
        ip_address: credentials.ip_address,
        device_info: credentials.device_name,
        timestamp: now,
        success: false,
        failure_reason: 'Hotspot authentication service is stopped by Admin',
      };
      this.attempts.unshift(attempt);
      this.saveAttempts();
      this.notify();
      return { success: false, message: 'Hotspot Authentication is currently OFF.' };
    }

    const user = this.users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      const attempt: LoginAttemptEntity = {
        id: Date.now(),
        username: cleanUsername,
        ip_address: credentials.ip_address,
        device_info: credentials.device_name,
        timestamp: now,
        success: false,
        failure_reason: 'Username not found in authorized database',
      };
      this.attempts.unshift(attempt);
      this.saveAttempts();
      this.notify();
      return { success: false, message: 'Invalid credentials. User not registered.' };
    }

    if (!user.active) {
      const attempt: LoginAttemptEntity = {
        id: Date.now(),
        username: cleanUsername,
        ip_address: credentials.ip_address,
        device_info: credentials.device_name,
        timestamp: now,
        success: false,
        failure_reason: 'User account is deactivated by administrator',
      };
      this.attempts.unshift(attempt);
      this.saveAttempts();
      this.notify();
      return { success: false, message: 'Your account is deactivated. Please contact the administrator.' };
    }

    const computedHash = await hashPasswordSha256(credentials.password_plaintext, user.salt);
    if (computedHash !== user.password_hash) {
      const attempt: LoginAttemptEntity = {
        id: Date.now(),
        username: cleanUsername,
        ip_address: credentials.ip_address,
        device_info: credentials.device_name,
        timestamp: now,
        success: false,
        failure_reason: 'Incorrect password provided',
      };
      this.attempts.unshift(attempt);
      this.saveAttempts();
      this.notify();
      return { success: false, message: 'Invalid password. Authentication failed.' };
    }

    // Success! Disconnect any prior session with this IP or user if needed
    this.logs.forEach(l => {
      if (l.ip_address === credentials.ip_address && l.status === 'connected') {
        l.status = 'disconnected';
        l.disconnected_at = now;
      }
    });

    const newSession: ConnectionLogEntity = {
      id: Date.now(),
      user_id: user.id,
      username: user.username,
      device_name: credentials.device_name || 'Generic Wi-Fi Client',
      ip_address: credentials.ip_address || `192.168.43.${Math.floor(Math.random() * 200) + 10}`,
      mac_address: credentials.mac_address || '02:00:00:xx:xx:xx',
      user_agent: credentials.user_agent || navigator.userAgent,
      connected_at: now,
      disconnected_at: null,
      status: 'connected',
      bytes_in: Math.floor(Math.random() * 500000) + 100000,
      bytes_out: Math.floor(Math.random() * 200000) + 50000,
    };

    user.total_connections += 1;
    user.last_connected_at = now;

    this.logs.unshift(newSession);
    this.saveLogs();
    this.saveUsers();

    const successAttempt: LoginAttemptEntity = {
      id: Date.now() + 1,
      username: user.username,
      ip_address: newSession.ip_address,
      device_info: newSession.device_name,
      timestamp: now,
      success: true,
    };
    this.attempts.unshift(successAttempt);
    this.saveAttempts();

    this.updateActiveCount();
    this.notify();

    return {
      success: true,
      message: `Welcome, ${user.name}! Connected to Hotspot successfully.`,
      user,
      session: newSession,
    };
  }

  public disconnectClient(logId: number) {
    const log = this.logs.find(l => l.id === logId);
    if (!log) return;
    log.status = 'disconnected';
    log.disconnected_at = new Date().toISOString();
    this.saveLogs();
    this.updateActiveCount();
    this.notify();
  }

  public kickClient(logId: number) {
    const log = this.logs.find(l => l.id === logId);
    if (!log) return;
    log.status = 'kicked';
    log.disconnected_at = new Date().toISOString();
    this.saveLogs();
    this.updateActiveCount();
    this.notify();
  }

  public clearHistoryLogs() {
    this.logs = this.logs.filter(l => l.status === 'connected');
    this.attempts = [];
    this.saveLogs();
    this.saveAttempts();
    this.notify();
  }

  public resetAllData() {
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEY_SERVER);
    localStorage.removeItem(STORAGE_KEY_ADMIN_PIN);
    this.init();
  }
}

export const dbService = new HotspotDbSimulator();
