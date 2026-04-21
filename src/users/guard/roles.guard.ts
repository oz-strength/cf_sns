import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**
     * Roles annotation에 대한 metadata를 가져와야한다.
     *
     * Reflector
     * getAllAndOverride 가장 가까이에 있는 애노테이션을 가져온다
     */
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(), // 메소드
      context.getClass(), // 컨트롤러
    ]);

    // Roles annotation이 없는 경우, 즉 권한 체크가 필요없는 경우는 true를 반환하여 접근을 허용한다.
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // 사용자가 없다면
    if (!user) {
      throw new UnauthorizedException(`토큰을 제공 해주세요`);
    }

    if (user.role !== requiredRoles) {
      throw new ForbiddenException(
        `권한이 없습니다. requiredRoles: ${requiredRoles}, your role: ${user.role}`,
      );
    }
    return true;
  }
}
