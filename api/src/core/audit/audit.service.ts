import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AuditLog, AuditAction, AuditEntityType } from '../../entities/audit-log.entity';

export interface AuditContext {
  userId: string;
  projectId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  tags?: string[];
  context?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  async log(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    context: AuditContext,
    options?: {
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      description?: string;
      isSensitive?: boolean;
    }
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        action,
        entityType,
        entityId,
        projectId: context.projectId,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        oldValues: options?.oldValues,
        newValues: options?.newValues,
        description: options?.description,
        isSensitive: options?.isSensitive || false,
        metadata: {
          sessionId: context.sessionId,
          requestId: context.requestId,
          endpoint: context.endpoint,
          method: context.method,
          statusCode: context.statusCode,
          duration: context.duration,
          tags: context.tags,
          context: context.context
        }
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Don't let audit logging failures break the main application
      console.error('Audit logging failed:', error);
    }
  }

  async logFromRequest(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    req: Request,
    userId: string,
    options?: {
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      description?: string;
      isSensitive?: boolean;
      projectId?: string;
      tags?: string[];
      context?: Record<string, any>;
    }
  ): Promise<void> {
    const context: AuditContext = {
      userId,
      projectId: options?.projectId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: (req as any).session?.id,
      requestId: req.headers['x-request-id'] as string,
      endpoint: req.path,
      method: req.method,
      tags: options?.tags,
      context: options?.context
    };

    await this.log(action, entityType, entityId, context, {
      oldValues: options?.oldValues,
      newValues: options?.newValues,
      description: options?.description,
      isSensitive: options?.isSensitive
    });
  }

  async getAuditTrail(
    entityType: AuditEntityType,
    entityId: string,
    options?: {
      limit?: number;
      offset?: number;
      actions?: AuditAction[];
      startDate?: Date;
      endDate?: Date;
      includeSensitive?: boolean;
    }
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit')
      .where('audit.entityType = :entityType', { entityType })
      .andWhere('audit.entityId = :entityId', { entityId })
      .orderBy('audit.createdAt', 'DESC');

    if (options?.actions?.length) {
      query.andWhere('audit.action IN (:...actions)', { actions: options.actions });
    }

    if (options?.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: options.endDate });
    }

    if (!options?.includeSensitive) {
      query.andWhere('audit.isSensitive = :isSensitive', { isSensitive: false });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return query.getMany();
  }

  async getProjectAuditTrail(
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      actions?: AuditAction[];
      entityTypes?: AuditEntityType[];
      startDate?: Date;
      endDate?: Date;
      includeSensitive?: boolean;
    }
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit')
      .where('audit.projectId = :projectId', { projectId })
      .orderBy('audit.createdAt', 'DESC');

    if (options?.actions?.length) {
      query.andWhere('audit.action IN (:...actions)', { actions: options.actions });
    }

    if (options?.entityTypes?.length) {
      query.andWhere('audit.entityType IN (:...entityTypes)', { entityTypes: options.entityTypes });
    }

    if (options?.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: options.endDate });
    }

    if (!options?.includeSensitive) {
      query.andWhere('audit.isSensitive = :isSensitive', { isSensitive: false });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return query.getMany();
  }

  async getUserAuditTrail(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      actions?: AuditAction[];
      entityTypes?: AuditEntityType[];
      startDate?: Date;
      endDate?: Date;
      includeSensitive?: boolean;
    }
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit')
      .where('audit.userId = :userId', { userId })
      .orderBy('audit.createdAt', 'DESC');

    if (options?.actions?.length) {
      query.andWhere('audit.action IN (:...actions)', { actions: options.actions });
    }

    if (options?.entityTypes?.length) {
      query.andWhere('audit.entityType IN (:...entityTypes)', { entityTypes: options.entityTypes });
    }

    if (options?.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: options.endDate });
    }

    if (!options?.includeSensitive) {
      query.andWhere('audit.isSensitive = :isSensitive', { isSensitive: false });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return query.getMany();
  }

  async getAuditSummary(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActions: number;
    actionsByType: Record<AuditAction, number>;
    actionsByEntity: Record<AuditEntityType, number>;
    actionsByUser: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    recentActivity: AuditLog[];
  }> {
    const logs = await this.getProjectAuditTrail(projectId, {
      startDate,
      endDate,
      includeSensitive: false
    });

    const actionsByType: Record<AuditAction, number> = {} as Record<AuditAction, number>;
    const actionsByEntity: Record<AuditEntityType, number> = {} as Record<AuditEntityType, number>;
    const actionsByUser: Record<string, number> = {};
    const userCounts: Record<string, number> = {};

    logs.forEach(log => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      actionsByEntity[log.entityType] = (actionsByEntity[log.entityType] || 0) + 1;
      actionsByUser[log.userId] = (actionsByUser[log.userId] || 0) + 1;
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    });

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActions: logs.length,
      actionsByType,
      actionsByEntity,
      actionsByUser,
      topUsers,
      recentActivity: logs.slice(0, 20)
    };
  }
}
