import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Scene } from './scene.entity';
import { Frame } from './frame.entity';

@Entity('shots')
export class Shot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  order_index: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  angle: string; // 'WIDE', 'MEDIUM', 'CLOSE', 'EXTREME_CLOSE'

  @Column({ type: 'varchar', length: 50 })
  size: string; // 'LONG', 'FULL', 'MEDIUM', 'CLOSE_UP', 'EXTREME_CLOSE_UP'

  @Column({ type: 'varchar', length: 50, nullable: true })
  movement: string; // 'STATIC', 'PAN', 'TILT', 'DOLLY', 'CRANE'

  @Column({ type: 'varchar', length: 50, nullable: true })
  lens: string; // 'WIDE', 'NORMAL', 'TELEPHOTO'

  @Column({ type: 'int', nullable: true })
  duration: number; // in seconds

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  scene_id: string;

  @ManyToOne(() => Scene, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scene_id' })
  scene: Scene;

  @OneToMany(() => Frame, (frame) => frame.shot)
  frames: Frame[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
