import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Shot } from './shot.entity';

@Entity('frames')
export class Frame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  s3_key: string;

  @Column({ type: 'varchar', length: 100 })
  style: string; // 'sketch', 'storyboard', 'concept', 'line_art'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // prompt, seed, model info

  @Column({ type: 'varchar', length: 50, default: 'generated' })
  source: string; // 'generated', 'uploaded'

  @Column({ type: 'uuid' })
  shot_id: string;

  @ManyToOne(() => Shot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shot_id' })
  shot: Shot;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
