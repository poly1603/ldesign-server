import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { OperationLog } from './operation-log.entity';

/**
 * 项目操作类型
 */
export enum OperationType {
  DEV = 'dev',
  BUILD = 'build',
  PREVIEW = 'preview',
}

/**
 * 操作状态
 */
export enum OperationStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * 项目操作记录实体
 */
@Entity('project_operations')
export class ProjectOperation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({
    type: 'text',
    enum: OperationType,
  })
  type: OperationType;

  @Column({
    type: 'text',
    enum: OperationStatus,
    default: OperationStatus.RUNNING,
  })
  status: OperationStatus;

  @Column({ nullable: true })
  pid: number;

  @Column({ nullable: true })
  mode: string;

  @Column({ nullable: true })
  port: number;

  @Column({ nullable: true })
  host: string;

  @Column({ nullable: true })
  serverUrl: string;

  @Column({ nullable: true })
  exitCode: number;

  @Column({ nullable: true })
  exitSignal: string;

  @CreateDateColumn()
  startTime: Date;

  @Column({ type: 'datetime', nullable: true })
  endTime: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OperationLog, (log) => log.operation)
  logs: OperationLog[];
}
