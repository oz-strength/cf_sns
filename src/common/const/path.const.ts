import { join } from 'path';

// 서버 프로젝트 루트 경로
export const PROJECT_ROOT_PATH = process.cwd();
// 외부에서 접근 가능한 파일을 모아둔 디렉토리 경로
export const PUBLIC_FOLDER_NAME = 'public';
// 포스트 이미지들을 저장할 폴더 이름
export const POST_FOLDER_NAME = 'posts';

// 실제 공개폴더의 절대경로
// /{프로젝트 위치}/public
export const PUBLIC_FOLDER_PATH = join(PROJECT_ROOT_PATH, PUBLIC_FOLDER_NAME);

// 포스트 이미지들이 저장될 폴더
// /{프로젝트 위치}/public/posts
export const POST_IMAGE_PATH = join(PUBLIC_FOLDER_PATH, POST_FOLDER_NAME);

// /public/posts/xxx.jpg
// export const POST_PUBLIC_IMAGE_PATH = join(
//   PUBLIC_FOLDER_NAME,
//   POST_FOLDER_NAME,
// );
export const POST_PUBLIC_IMAGE_PATH = `${PUBLIC_FOLDER_NAME}/${POST_FOLDER_NAME}`;
