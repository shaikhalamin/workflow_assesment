import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginateRepo } from '../../common/http/paginate';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { ConditionValidatorService } from './condition-validator.service';
import { CreateWorkflowEventSchemaDto } from './dto/create-workflow-event-schema.dto';
import { UpdateWorkflowEventSchemaDto } from './dto/update-workflow-event-schema.dto';
import { WorkflowEventSchema } from './entities/workflow-event-schema.entity';

@Injectable()
export class WorkflowEventSchemaService {
  constructor(
    @InjectRepository(WorkflowEventSchema)
    private readonly schemasRepository: Repository<WorkflowEventSchema>,
    private readonly conditionValidator: ConditionValidatorService,
  ) {}

  list(query: PaginationQueryDto) {
    return paginateRepo(this.schemasRepository, {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<WorkflowEventSchema> {
    const schema = await this.schemasRepository.findOneBy({ id });
    if (!schema) throw new NotFoundException('Workflow event schema not found');
    return schema;
  }

  async create(dto: CreateWorkflowEventSchemaDto): Promise<WorkflowEventSchema> {
    this.conditionValidator.validateEventSchema(dto.fieldSchemaJson);
    return this.schemasRepository.save(
      this.schemasRepository.create({
        ...dto,
        outcomeActionsJson: dto.outcomeActionsJson ?? null,
        assigneeResolversJson: dto.assigneeResolversJson ?? null,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async update(
    id: string,
    dto: UpdateWorkflowEventSchemaDto,
  ): Promise<WorkflowEventSchema> {
    const schema = await this.findOne(id);
    if (dto.fieldSchemaJson) {
      this.conditionValidator.validateEventSchema(dto.fieldSchemaJson);
    }
    Object.assign(schema, dto);
    return this.schemasRepository.save(schema);
  }

  async deactivate(id: string): Promise<WorkflowEventSchema> {
    const schema = await this.findOne(id);
    schema.isActive = false;
    return this.schemasRepository.save(schema);
  }
}
