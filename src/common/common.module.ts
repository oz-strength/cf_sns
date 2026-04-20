import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';
import { extname } from 'path/win32';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { v4 as uuid } from 'uuid';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { TEMP_FOLDER_PATH } from './const/path.const';
@Module({
  imports: [
    AuthModule,
    UsersModule,
    MulterModule.register({
      limits: {
        // 바이트 단위로 입력
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        /**
         * callback(error, boolean)
         *
         * 첫번째 파라미터는 에러가 있을경우 에러 정보를 넣는다
         * 두번째 파라미터는 파일을 받을지 말지 여부를 boolean으로 넣는다
         */

        // xxx.jpg -> extname() -> .jpg
        const ext = extname(file.originalname);
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
          return callback(
            new BadRequestException('jpg/jpeg/png 파일만 업로드 가능합니다.'),
            false,
          );
        }
        return callback(null, true);
      },
      storage: multer.diskStorage({
        destination: function (req, file, callback) {
          callback(null, TEMP_FOLDER_PATH);
        },
        filename: function (req, file, callback) {
          callback(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
