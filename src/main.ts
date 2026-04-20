import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 값을 넣지 않아도 default 값이 형성되게 설정
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
