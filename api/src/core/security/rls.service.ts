import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Project } from '../../entities/project.entity';

export interface RLSContext {
  userId: string;
  userRole: string;
  projectId?: string;
  organizationId?: string;
}

@Injectable()
export class RLSService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>
  ) {}

  async enforceProjectAccess(context: RLSContext, projectId: string): Promise<boolean> {
    try {
      // Check if user has direct access to project
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['users', 'organization']
      });

      if (!project) {
        return false;
      }

      // Super admin can access all projects
      if (context.userRole === 'super_admin') {
        return true;
      }

      // Organization admin can access projects in their organization
      if (context.userRole === 'org_admin' && project.organization?.id === context.organizationId) {
        return true;
      }

      // Check if user is directly assigned to project
      const hasDirectAccess = project.users?.some(user => user.id === context.userId);
      if (hasDirectAccess) {
        return true;
      }

      // Check if user has access through organization membership
      if (project.organization?.id === context.organizationId) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('RLS enforcement error:', error);
      return false;
    }
  }

  async enforceSceneAccess(context: RLSContext, sceneId: string): Promise<boolean> {
    // Scenes inherit access from their project
    const scene = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project.scenes', 'scene')
      .where('scene.id = :sceneId', { sceneId })
      .getOne();

    if (!scene) {
      return false;
    }

    return this.enforceProjectAccess(context, scene.id);
  }

  async enforceShotAccess(context: RLSContext, shotId: string): Promise<boolean> {
    // Shots inherit access from their scene
    const shot = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project.scenes', 'scene')
      .innerJoin('scene.shots', 'shot')
      .where('shot.id = :shotId', { shotId })
      .getOne();

    if (!shot) {
      return false;
    }

    return this.enforceProjectAccess(context, shot.id);
  }

  async enforceFrameAccess(context: RLSContext, frameId: string): Promise<boolean> {
    // Frames inherit access from their shot
    const frame = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project.scenes', 'scene')
      .innerJoin('scene.shots', 'shot')
      .innerJoin('shot.frames', 'frame')
      .where('frame.id = :frameId', { frameId })
      .getOne();

    if (!frame) {
      return false;
    }

    return this.enforceProjectAccess(context, frame.id);
  }

  async enforceAnimaticAccess(context: RLSContext, animaticId: string): Promise<boolean> {
    // Animatics inherit access from their scene
    const animatic = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project.scenes', 'scene')
      .innerJoin('scene.animatics', 'animatic')
      .where('animatic.id = :animaticId', { animaticId })
      .getOne();

    if (!animatic) {
      return false;
    }

    return this.enforceProjectAccess(context, animatic.id);
  }

  async enforceExportAccess(context: RLSContext, exportId: string): Promise<boolean> {
    // Exports inherit access from their project
    const exportItem = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project.exports', 'export')
      .where('export.id = :exportId', { exportId })
      .getOne();

    if (!exportItem) {
      return false;
    }

    return this.enforceProjectAccess(context, exportItem.id);
  }

  async getUserProjects(context: RLSContext): Promise<string[]> {
    try {
      let query = this.projectRepository
        .createQueryBuilder('project')
        .select('project.id');

      if (context.userRole === 'super_admin') {
        // Super admin can see all projects
        const projects = await query.getMany();
        return projects.map(p => p.id);
      }

      if (context.userRole === 'org_admin') {
        // Organization admin can see projects in their organization
        const projects = await query
          .innerJoin('project.organization', 'org')
          .where('org.id = :orgId', { orgId: context.organizationId })
          .getMany();
        return projects.map(p => p.id);
      }

      // Regular users can see projects they have access to
      const projects = await query
        .leftJoin('project.users', 'user')
        .leftJoin('project.organization', 'org')
        .where('user.id = :userId OR org.id = :orgId', {
          userId: context.userId,
          orgId: context.organizationId
        })
        .getMany();

      return projects.map(p => p.id);
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  async addRLSPolicies(): Promise<void> {
    // This would be called during database initialization
    // to set up RLS policies at the database level
    
    const policies = [
      // Project access policy
      `
        CREATE POLICY project_access_policy ON projects
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM project_users pu
            WHERE pu.project_id = projects.id
            AND pu.user_id = current_setting('app.current_user_id')::uuid
          )
          OR EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = projects.organization_id
            AND o.id = current_setting('app.current_organization_id')::uuid
          )
          OR current_setting('app.user_role') = 'super_admin'
        );
      `,
      
      // Scene access policy
      `
        CREATE POLICY scene_access_policy ON scenes
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM projects p
            INNER JOIN project_users pu ON pu.project_id = p.id
            WHERE p.id = scenes.project_id
            AND pu.user_id = current_setting('app.current_user_id')::uuid
          )
          OR EXISTS (
            SELECT 1 FROM projects p
            INNER JOIN organizations o ON o.id = p.organization_id
            WHERE p.id = scenes.project_id
            AND o.id = current_setting('app.current_organization_id')::uuid
          )
          OR current_setting('app.user_role') = 'super_admin'
        );
      `,
      
      // Shot access policy
      `
        CREATE POLICY shot_access_policy ON shots
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM scenes s
            INNER JOIN projects p ON p.id = s.project_id
            INNER JOIN project_users pu ON pu.project_id = p.id
            WHERE s.id = shots.scene_id
            AND pu.user_id = current_setting('app.current_user_id')::uuid
          )
          OR EXISTS (
            SELECT 1 FROM scenes s
            INNER JOIN projects p ON p.id = s.project_id
            INNER JOIN organizations o ON o.id = p.organization_id
            WHERE s.id = shots.scene_id
            AND o.id = current_setting('app.current_organization_id')::uuid
          )
          OR current_setting('app.user_role') = 'super_admin'
        );
      `,
      
      // Frame access policy
      `
        CREATE POLICY frame_access_policy ON frames
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM shots shot
            INNER JOIN scenes s ON s.id = shot.scene_id
            INNER JOIN projects p ON p.id = s.project_id
            INNER JOIN project_users pu ON pu.project_id = p.id
            WHERE shot.id = frames.shot_id
            AND pu.user_id = current_setting('app.current_user_id')::uuid
          )
          OR EXISTS (
            SELECT 1 FROM shots shot
            INNER JOIN scenes s ON s.id = shot.scene_id
            INNER JOIN projects p ON p.id = s.project_id
            INNER JOIN organizations o ON o.id = p.organization_id
            WHERE shot.id = frames.shot_id
            AND o.id = current_setting('app.current_organization_id')::uuid
          )
          OR current_setting('app.user_role') = 'super_admin'
        );
      `
    ];

    // In a real implementation, these would be executed against the database
    console.log('RLS policies would be created here');
  }

  async setRLSContext(context: RLSContext): Promise<void> {
    // Set PostgreSQL session variables for RLS
    const queries = [
      `SET app.current_user_id = '${context.userId}'`,
      `SET app.user_role = '${context.userRole}'`,
      ...(context.organizationId ? [`SET app.current_organization_id = '${context.organizationId}'`] : [])
    ];

    // In a real implementation, these would be executed against the database
    console.log('RLS context would be set:', queries);
  }
}
