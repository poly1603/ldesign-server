import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Menu } from './menu.entity';

export enum PermissionType {
  MENU = 'menu',
  BUTTON = 'button',
  API = 'api',
  DATA = 'data',
}

export enum PermissionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PermissionType,
    default: PermissionType.MENU,
  })
  type: PermissionType;

  @Column({
    type: 'enum',
    enum: PermissionStatus,
    default: PermissionStatus.ACTIVE,
  })
  status: PermissionStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  resource: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  action: string;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  group: string;

  @Column({ type: 'int', nullable: true })
  parentId: number;

  @ManyToOne(() => Permission, (permission) => permission.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Permission | null;

  @OneToMany(() => Permission, (permission) => permission.parent)
  children: Permission[];

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @ManyToMany(() => Menu, (menu) => menu.permissions)
  menus: Menu[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get fullName(): string {
    return this.displayName || this.name;
  }

  isChildOf(parentPermission: Permission): boolean {
    let current = this.parent;
    while (current) {
      if (current.id === parentPermission.id) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
}