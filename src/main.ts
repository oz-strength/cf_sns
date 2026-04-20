import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 값을 넣지 않아도 default 값이 형성되게 설정
      transformOptions: {
        enableImplicitConversion: true, // transformer의 @Type 없어도 자동으로 변환
      },
      whitelist: true, // DTO에 정의된 속성만 허용
      forbidNonWhitelisted: true, // 허용되지 않은 속성이 있으면 에러를 발생시킨다.
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
