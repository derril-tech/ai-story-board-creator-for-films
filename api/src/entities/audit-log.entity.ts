import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  REJECT = 'reject',
  PUBLISH = 'publish',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PERMISSION_CHANGE = 'permission_change',
  ROLE_CHANGE = 'role_change'
}

export enum AuditEntityType {
  USER = 'user',
  PROJECT = 'project',
  SCRIPT = 'script',
  SCENE = 'scene',
  SHOT = 'shot',
  FRAME = 'frame',
  DIALOGUE = 'dialogue',
  ANIMATIC = 'animatic',
  EXPORT = 'export',
  STORYBOARD_VERSION = 'storyboard_version',
  COMMENT = 'comment',
  ORGANIZATION = 'organization',
  ROLE = 'role',
  PERMISSION = 'permission'
}

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['userId'])
@Index(['projectId'])
@Index(['createdAt'])
@Index(['action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditEntityType
  })
  entityType: AuditEntityType;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'uuid', nullable: true })
  projectId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    sessionId?: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
    error?: string;
    tags?: string[];
    context?: Record<string, any>;
  };

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isSensitive: boolean; // For sensitive operations that might need special handling

  @CreateDateColumn()
  createdAt: Date;

  // Computed properties for easier querying
  @Column({ type: 'date', generatedType: 'STORED', asExpression: 'DATE(created_at)' })
  createdDate: Date;

  @Column({ type: 'time', generatedType: 'STORED', asExpression: 'TIME(created_at)' })
  createdTime: Date;
}
