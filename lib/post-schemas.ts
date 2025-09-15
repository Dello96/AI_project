import { z } from 'zod'

// 게시글 카테고리 타입
export const postCategorySchema = z.enum(['notice', 'free', 'qna'], {
  message: '카테고리를 선택해주세요.'
})

// 게시글 작성/수정 폼 스키마
export const postFormSchema = z.object({
  title: z
    .string()
    .min(2, '제목은 2자 이상 입력해주세요.')
    .max(100, '제목은 100자 이하로 입력해주세요.')
    .regex(/^[^\s].*[^\s]$/, '제목은 앞뒤 공백을 포함할 수 없습니다.'),
  content: z
    .string()
    .min(10, '내용은 10자 이상 입력해주세요.')
    .max(5000, '내용은 5000자 이하로 입력해주세요.')
    .regex(/^[^\s].*[^\s]$/, '내용은 앞뒤 공백을 포함할 수 없습니다.'),
  category: postCategorySchema,
  isAnonymous: z.boolean().default(false),
  attachments: z.array(z.string()).default([])
})

// 게시글 수정 폼 스키마 (모든 필드가 선택적)
export const postUpdateSchema = postFormSchema.partial()

// 게시글 검색/필터 스키마
export const postFilterSchema = z.object({
  category: postCategorySchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['latest', 'popular', 'views']).default('latest'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
})

// 게시글 타입 정의
export type PostFormData = z.infer<typeof postFormSchema>
export type PostUpdateData = z.infer<typeof postUpdateSchema>
export type PostFilterData = z.infer<typeof postFilterSchema>
export type PostCategory = z.infer<typeof postCategorySchema>

// 게시글 폼 기본값
export const defaultPostFormData: PostFormData = {
  title: '',
  content: '',
  category: 'free',
  isAnonymous: false,
  attachments: []
}

// 게시글 카테고리 옵션
export const postCategoryOptions = [
  { value: 'notice' as const, label: '공지사항', color: 'bg-red-500' },
  { value: 'free' as const, label: '자유게시판', color: 'bg-blue-500' },
  { value: 'qna' as const, label: 'Q&A', color: 'bg-green-500' }
] as const

// 정렬 옵션
export const sortOptions = [
  { value: 'latest' as const, label: '최신순' },
  { value: 'popular' as const, label: '인기순' },
  { value: 'views' as const, label: '조회순' }
] as const
