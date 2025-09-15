import { z } from 'zod'

// 댓글 생성 스키마
export const CommentCreateSchema = z.object({
  content: z.string()
    .min(1, '댓글 내용은 필수입니다.')
    .max(1000, '댓글은 1000자 이하로 작성해주세요.')
    .refine(
      (content) => content.trim().length > 0,
      '댓글 내용을 입력해주세요.'
    ),
  isAnonymous: z.boolean().optional().default(false),
  parentId: z.string().uuid().optional().nullable()
})

// 댓글 수정 스키마
export const CommentUpdateSchema = z.object({
  content: z.string()
    .min(1, '댓글 내용은 필수입니다.')
    .max(1000, '댓글은 1000자 이하로 작성해주세요.')
    .refine(
      (content) => content.trim().length > 0,
      '댓글 내용을 입력해주세요.'
    )
})

// 댓글 쿼리 파라미터 스키마
export const CommentQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number)
})

// 댓글 응답 스키마
export const CommentResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.string(),
    postId: z.string(),
    authorId: z.string(),
    content: z.string(),
    isAnonymous: z.boolean(),
    parentId: z.string().nullable().optional(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
    author: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string()
    }).optional()
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  }).optional()
})

export type CommentCreateData = z.infer<typeof CommentCreateSchema>
export type CommentUpdateData = z.infer<typeof CommentUpdateSchema>
export type CommentQueryData = z.infer<typeof CommentQuerySchema>
export type CommentResponseData = z.infer<typeof CommentResponseSchema>
