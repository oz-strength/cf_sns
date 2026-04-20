import { Injectable } from '@nestjs/common';
import { FindManyOptions, Repository } from 'typeorm';
import { BasePaginationDto } from './dto/base-pagination.dto';
import { BaseModel } from './entity/base.entity';

@Injectable()
export class CommonService {
  paginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {}
}
