import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { FILTER_MAPPER } from './const/filter-mapper.const';
import { BasePaginationDto } from './dto/base-pagination.dto';
import { BaseModel } from './entity/base.entity';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}

  paginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    if (dto.page) {
      return this.pagePaginate(dto, repository, overrideFindOptions);
    } else {
      return this.cursorPaginate(dto, repository, overrideFindOptions, path);
    }
  }

  // page 기반 pagination
  private async pagePaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
  ) {
    const findOptions = this.composeFindOptions<T>(dto);

    const [data, count] = await repository.findAndCount({
      ...findOptions,
      ...overrideFindOptions,
    });

    return {
      data,
      total: count,
    };
  }

  // cursor 기반 pagination
  private async cursorPaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    /**
     * 정렬 조건이 달라지면 구현도 달라져야한다.
     *
     * where__likeCount__more_than
     *
     * whre__title__ilike
     */
    const findOptions = this.composeFindOptions<T>(dto);

    // const results = await repository.find({
    //   ...findOptions,
    //   ...overrideFindOptions,
    // });

    const merged = {
      ...findOptions,
      ...overrideFindOptions,
    };

    console.dir(merged, { depth: 10 });

    const results = await repository.find(merged);

    const lastItem =
      results.length > 0 && results.length === dto.take // 마지막 페이지즈음에 20개보다 작게 가져오면 다음 페이지 필요없음
        ? results[results.length - 1]
        : null;

    const protocol = this.configService.get('PROTOCOL');
    const host = this.configService.get('HOST');

    const nextUrl = lastItem && new URL(`${protocol}://${host}/${path}`);

    if (nextUrl) {
      /**
       * dto의 키 값들을 루핑하면서
       * 키값에 해당되는 밸류가 존재하면
       * param에 그대로 붙여넣는다.
       *
       * 단, where__id_more_than 값만 lastItem의 마지막 값으로 넣어준다.
       */
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]); // 정렬, 가져올데이터개수는 게속 url에 붙어있어야 한다.
          }
        }
      }

      const key =
        dto.order__createdAt === 'ASC'
          ? 'where__id__more_than'
          : 'where__id__less_than';

      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    return {
      data: results,
      cursor: {
        after: lastItem?.id ?? null,
      },
      count: results.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  composeFindOptions<T extends BaseModel>(
    dto: BasePaginationDto,
  ): FindManyOptions<T> {
    /**
     * where,
     * order,
     * take,
     * skip -> page 기반 pagination에서만 사용
     */
    /**
     * DTO의 현재 생긴 구조는 아래와 같다
     *
     * {
     *   where__id__more_than: 1;
     *   order__createdAt: 'ASC';
     * }
     *
     * 현재는 where__id__more_than, where__id__less_than 에 해당되는 where 필터만 사용중이지만
     * 향후에 where__likeCount__more_than, where__title__ilike 등 다양한 필터가 추가될 수 있다.
     * 모든 where 필터들을 자동으로 파싱할 수 있을만한 기능을 제작해야한다.
     *
     * 1) where로 시작한다면 필터 로직을 적용한다.
     * 2) order로 시작한다면 정렬 로직을 적용한다.
     * 3) 필터 로직을 적용한다면 '__' 기준으로 split 했을 때 3개의 값으로 나뉘는지
     *    2개의 값으로 나뉘는지 확인한다.
     * 3-1) 3개의 값으로 나뉜다면 FILTER_MAPPER에서 해당되는 operator 함수를 찾아서 적용한다.
     *      ['where', 'id', 'more_than'] -> MoreThan(dto['where__id__more_than'])
     * 3-2) 2개의 값으로 나뉜다면 정확한 값을 필터하는 것이기 때문에 operator 없이 적용한다.
     *      ['where', 'id'] -> dto['where__id']
     * 4) order의 경우 3-2)와 동일하게 적용한다.
     */

    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    // value가 undefined 면
    // where: {
    //   id: MoreThan(undefined)
    // } 이런식으로 되어서 에러가 나기 때문에 value가 존재할 때만 where 조건에 추가하도록 한다.
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined || value === null) {
        continue;
      }

      // key: where__id__more_than
      // vlue: 1
      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value),
        };
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseWhereFilter(key, value),
        };
      }
    }

    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? (dto.page - 1) * dto.take : undefined,
    };
  }

  private parseWhereFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsWhere<T> | FindOptionsOrder<T> {
    const options: FindOptionsWhere<T> = {};

    /**
     * 예를 들어 where__id__more_than 이라는 key가 들어온다면
     * 1) key를 '__' 기준으로 split 한다 -> ['where', 'id', 'more_than']
     */
    const split = key.split('__');

    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(
        `where 필터는 '__' 기준으로 2개 또는 3개의 값으로 나뉘어야 합니다. 현재 key: ${key}`,
      );
    }

    /**
     * 길이가 2일 경우는
     * where__id = 3
     *
     * FindOptionsWhere로 풀어보면
     * 아래와 같다
     *
     * {
     *   id: 3,
     * }
     */
    if (split.length === 2) {
      // ['where', 'id']
      const [_, field] = split;

      /**
       * field: id
       * value: 3
       */
      options[field] = value;
    } else {
      /**
       * 길이가 3일 경우에는 TypeORM의 유틸리티 적용이 필요한 경우이다.
       *
       * where__id__more_than의 경우
       * where 는 버려도 되고 두번째 값인 id는 필터할 키값이 되고
       * 세번째 값은 more_than이며 TypeORM의 유틸리티가 된다.
       *
       * FILTER_MAPPER에서 미리 정의해둔 값들로
       * field 값에 FILTER_MAPPER에서 해당되는 utility를 가져온 후
       * 값에 적용해 준다.
       */

      // ['where', 'id', 'more_than']
      const [_, field, operator] = split;

      // where__id__between = 3,4
      // 만약에 split 대상 문자가 존재하지 않으면 길이가 무조건 1이다.
      // const values = value.toString().split(',');

      // field: id
      // operator: more_than
      // FILTER_MAPPER[more_than] -> MoreThan
      // if (operator === 'between') {
      //   options[field] = FILTER_MAPPER[operator](values[0], values[1]);
      // } else {
      //   options[field] = FILTER_MAPPER[operator](value);
      // }
      if (operator === 'i_like') {
        options[field] = FILTER_MAPPER[operator](`%${value}%`);
      } else {
        options[field] = FILTER_MAPPER[operator](value);
      }
    }

    return options;
  }

  private parseOrderFilter<T extends BaseModel>(
    key: string,
    value: unknown,
  ): FindOptionsOrder<T> {
    const split = key.split('__');

    if (split.length !== 2) {
      throw new BadRequestException(
        `order 필터는 '__' 기준으로 2개의 값으로 나뉘어야 합니다. 현재 key: ${key}`,
      );
    }

    const [, field] = split;

    if (value !== 'ASC' && value !== 'DESC') {
      throw new BadRequestException(
        `order 값은 ASC 또는 DESC 여야 합니다. 현재 value: ${String(value)}`,
      );
    }

    return {
      [field]: value,
    } as FindOptionsOrder<T>;
  }
}
