import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

export enum LogType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  QUERY = 'query',
  EXPORT = 'export',
  IMPORT = 'import',
  SYSTEM = 'system',
  API = 'api',
}

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @Column({
    type: 'enum',
    enum: LogType,
    default: LogType.SYSTEM,
  })
  type: LogType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  module: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  action: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  url: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string;

  @Column({ type: 'text', nullable: true })
  params: string;

  @Column({ type: 'text', nullable: true })
  result: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'int', nullable: true })
  responseTime: number;

  @Column({ type: 'int', nullable: true })
  statusCode: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'text', nullable: true })
  stackTrace: string;

  @Column({ type: 'int', nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  get userInfo(): string {
    if (this.user) {
      return `${this.user.username} (${this.user.email})`;
    }
    return 'Anonymous';
  }

  get isError(): boolean {
    return this.level === LogLevel.ERROR;
  }

  get isSuccess(): boolean {
    return this.statusCode >= 200 && this.statusCode < 300;
  }
}