import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProjectOperation } from './project-operation.entity';

/**
 * 日志类型
 */
export enum LogType {
  STDOUT = 'stdout',
  STDERR = 'stderr',
  ERROR = 'error',
}

/**
 * 操作日志实体
 */
@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  operationId: number;

  @ManyToOne(() => ProjectOperation, (operation) => operation.logs)
  @JoinColumn({ name: 'operationId' })
  operation: ProjectOperation;

  @Column({
    type: 'text',
    enum: LogType,
  })
  type: LogType;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn()
  timestamp: Date;
}
