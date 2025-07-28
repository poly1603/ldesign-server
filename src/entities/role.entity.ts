import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';

export enum RoleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  name: string;

  @Column({ length: 100, nullable: true })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RoleStatus,
    default: RoleStatus.ACTIVE,
  })
  status: RoleStatus;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  hasPermission(permissionName: string): boolean {
    return (
      this.permissions?.some((permission) => permission.name === permissionName) ||
      false
    );
  }

  getPermissionNames(): string[] {
    return this.permissions?.map((permission) => permission.name) || [];
  }
}