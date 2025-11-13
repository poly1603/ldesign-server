import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 项目类型枚举
 */
export enum ProjectType {
  PROJECT = 'project', // 纯项目
  LIBRARY = 'library', // 纯库
  HYBRID = 'hybrid', // 库+项目
  STATIC = 'static', // 静态项目
}

/**
 * 项目实体
 */
@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  path: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  version: string;

  @Column({
    type: 'text',
    enum: ProjectType,
    default: ProjectType.STATIC,
  })
  type: ProjectType;

  @Column({ nullable: true })
  framework: string;

  @Column({ type: 'simple-json', nullable: true })
  dependencies: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
