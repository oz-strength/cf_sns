import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { JWT_SECRET } from './const/auth.const';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}
  /**
   * 우리가 만드려는 기능
   *
   * 1) registerWithEmail
   *    - email, nickname, password를 입력받고 사용자를 생성한다.
   *    - 생성이 완료되면 accessToken과 refreshToken을 반환한다.
   *      - 회원가입 후 다시 로그인하는 것을 방지하기 위해
   * 2) loginWithEmail
   *    - email과 password를 입력받고 사용자를 인증한다.
   *    - 인증이 완료되면 accessToken과 refreshToken을 반환한다.
   * 3) loginUser
   *    - 1)과 2)에서 필요한 accessToken과 refreshToken을 반환하는 로직
   * 4) signToken
   *    - 3)에서 필요한 accessToken과 refreshToken을 sign(생성)하는 로직
   * 5) authenticateWithEmailAndPassword
   *    - 2)에서 로그인을 진행할때 필요한 기본적인 검증을 진행
   *    1. 사용자가 존재하는지 확인 (email로 검색)
   *    2. password가 일치하는지 확인 (bcrypt로 비교)
   *    3. 검증이 완료되면 사용자 정보를 반환한다.
   *    4. 반환된 데이터를 기반으로 토큰 생성
   */

  /**
   * Payload에 들어갈 정보
   *
   * 1) email
   * 2) sub -> id
   * 3) type -> 'access' | 'refresh'
   */
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, false),
    };
  }
}
