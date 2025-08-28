import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Scene } from './scene.entity';

@Entity('dialogues')
export class Dialogue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  character: string;

  @Column({ type: 'text' })
  line: string;

  @Column({ type: 'int', nullable: true })
  time_start: number; // in seconds from scene start

  @Column({ type: 'int', nullable: true })
  time_end: number; // in seconds from scene start

  @Column({ type: 'int', nullable: true })
  estimated_duration: number; // in seconds

  @Column({ type: 'int' })
  order_index: number;

  @Column({ type: 'uuid' })
  scene_id: string;

  @ManyToOne(() => Scene, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scene_id' })
  scene: Scene;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
