import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { IsPublic } from 'src/common/decorator/is-public-decorator';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { BasicTokenGuard } from './guard/basic-token.guard';
import { RefreshTokenGuard } from './guard/bearer-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // refresh 토큰으로 access 토큰 재발급
  @Post('token/access')
  @IsPublic() // 이 API는 인증이 필요없음
  @UseGuards(RefreshTokenGuard)
  postTokenAccess(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    const newToken = this.authService.rotateToken(token, false);

    /**
     * {accessToken: {token}}
     */
    return {
      accessToken: newToken,
    };
  }

  // refresh 토큰으로 refresh 토큰 재발급
  @Post('token/refresh')
  @IsPublic() // 이 API는 인증이 필요없음
  @UseGuards(RefreshTokenGuard)
  postTokenRefresh(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    const newToken = this.authService.rotateToken(token, true);

    /**
     * {refreshToken: {token}}
     */
    return {
      refreshToken: newToken,
    };
  }

  @Post('login/email')
  @IsPublic() // 이 API는 인증이 필요없음
  @UseGuards(BasicTokenGuard)
  postLoginEmail(@Headers('authorization') rawToken: string) {
    // email:password -> base64
    // aasdfklj'lwaeklfasjdl'f -> email:password
    const token = this.authService.extractTokenFromHeader(rawToken, false);

    const credentials = this.authService.decodeBasicToken(token);

    return this.authService.loginWithEmail(credentials);
  }

  @Post('register/email')
  @IsPublic() // 이 API는 인증이 필요없음
  postRegisterEmail(@Body() body: RegisterUserDto) {
    return this.authService.registerWithEmail(body);
  }
}
