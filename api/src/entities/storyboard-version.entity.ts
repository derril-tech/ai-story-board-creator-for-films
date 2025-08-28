import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

export enum VersionType {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
  DRAFT = 'draft'
}

export enum VersionStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published'
}

@Entity('storyboard_versions')
@Index(['projectId', 'versionNumber'])
@Index(['projectId', 'status'])
export class StoryboardVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'varchar', length: 50 })
  versionNumber: string; // e.g., "1.0.0", "1.1.0", "2.0.0"

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: VersionType,
    default: VersionType.MINOR
  })
  versionType: VersionType;

  @Column({
    type: 'enum',
    enum: VersionStatus,
    default: VersionStatus.DRAFT
  })
  status: VersionStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    scenes: Array<{
      id: string;
      title: string;
      shots: Array<{
        id: string;
        shotSize: string;
        shotAngle: string;
        frames: Array<{
          id: string;
          style: string;
          status: string;
        }>;
      }>;
    }>;
    totalFrames: number;
    totalShots: number;
    totalScenes: number;
    duration: number;
    changes: Array<{
      type: 'added' | 'modified' | 'removed';
      entity: 'scene' | 'shot' | 'frame';
      entityId: string;
      description: string;
    }>;
  };

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'boolean', default: false })
  isCurrent: boolean;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Project, project => project.versions)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @OneToMany(() => Comment, comment => comment.storyboardVersion)
  comments: Comment[];
}
