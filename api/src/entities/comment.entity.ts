import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './user.entity';
import { StoryboardVersion } from './storyboard-version.entity';

export enum CommentType {
  SCENE = 'scene',
  SHOT = 'shot',
  FRAME = 'frame',
  VERSION = 'version'
}

export enum CommentStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived'
}

@Entity('comments')
@Index(['entityType', 'entityId'])
@Index(['storyboardVersionId'])
@Index(['createdBy'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CommentType
  })
  entityType: CommentType;

  @Column({ type: 'uuid' })
  entityId: string; // ID of the scene, shot, frame, or version

  @Column({ type: 'uuid', nullable: true })
  storyboardVersionId: string;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId: string; // For threaded comments

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.ACTIVE
  })
  status: CommentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    position?: {
      x: number;
      y: number;
    };
    timestamp?: number; // For video/animatic comments
    frameNumber?: number; // For frame-specific comments
    shotNumber?: number; // For shot-specific comments
    sceneNumber?: number; // For scene-specific comments
    tags?: string[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'feedback' | 'question' | 'suggestion' | 'bug' | 'general';
    attachments?: Array<{
      id: string;
      type: 'image' | 'video' | 'audio' | 'document';
      url: string;
      filename: string;
    }>;
  };

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy: string;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => StoryboardVersion, version => version.comments)
  @JoinColumn({ name: 'storyboardVersionId' })
  storyboardVersion: StoryboardVersion;

  @ManyToOne(() => Comment, comment => comment.replies)
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: Comment;

  @ManyToOne(() => Comment)
  replies: Comment[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  author: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedTo' })
  assignee: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolvedBy' })
  resolver: User;
}
