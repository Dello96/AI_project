import { z } from 'zod'

// 신고 사유 ENUM
export const ReportReasonSchema = z.enum([
  'spam',
  'inappropriate_content',
  'harassment',
  'fake_news',
  'copyright_violation',
  'other'
])

// 신고 상태 ENUM
export const ReportStatusSchema = z.enum([
  'pending',
  'under_review',
  'resolved',
  'dismissed'
])

// 대상 타입 ENUM
export const TargetTypeSchema = z.enum([
  'post',
  'comment'
])

// 신고 생성 스키마
export const ReportCreateSchema = z.object({
  targetType: TargetTypeSchema,
  targetId: z.string().uuid('유효한 대상 ID가 아닙니다.'),
  reason: ReportReasonSchema,
  description: z.string()
    .min(10, '신고 사유는 최소 10자 이상 입력해주세요.')
    .max(500, '신고 사유는 500자 이하로 입력해주세요.')
    .optional()
})

// 신고 상태 업데이트 스키마
export const ReportUpdateSchema = z.object({
  status: ReportStatusSchema,
  adminNotes: z.string().max(1000, '관리자 메모는 1000자 이하로 입력해주세요.').optional(),
  assignedAdminId: z.string().uuid().optional()
})

// 신고 쿼리 파라미터 스키마
export const ReportQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  status: z.string().optional().default('all'),
  reason: z.string().optional().default('all')
})

// 신고 응답 스키마
export const ReportResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    id: z.string(),
    reporterId: z.string(),
    targetType: z.string(),
    targetId: z.string(),
    reason: z.string(),
    description: z.string().nullable(),
    status: z.string(),
    adminNotes: z.string().nullable(),
    assignedAdminId: z.string().nullable(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
    resolvedAt: z.string().or(z.date()).nullable(),
    reporter: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string()
    }).optional()
  }).optional()
})

// 신고 목록 응답 스키마
export const ReportListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    reports: z.array(z.object({
      id: z.string(),
      reporterId: z.string(),
      targetType: z.string(),
      targetId: z.string(),
      reason: z.string(),
      description: z.string().nullable(),
      status: z.string(),
      adminNotes: z.string().nullable(),
      assignedAdminId: z.string().nullable(),
      createdAt: z.string().or(z.date()),
      updatedAt: z.string().or(z.date()),
      resolvedAt: z.string().or(z.date()).nullable(),
      reporter: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string()
      }).optional()
    })),
    pagination: z.object({
      currentPage: z.number(),
      totalPages: z.number(),
      totalCount: z.number(),
      hasNextPage: z.boolean(),
      hasPrevPage: z.boolean()
    })
  })
})

// 신고 사유 라벨 매핑
export const REPORT_REASON_LABELS = {
  spam: '스팸',
  inappropriate_content: '부적절한 내용',
  harassment: '괴롭힘/욕설',
  fake_news: '가짜 뉴스',
  copyright_violation: '저작권 침해',
  other: '기타'
} as const

// 신고 상태 라벨 매핑
export const REPORT_STATUS_LABELS = {
  pending: '대기중',
  under_review: '검토중',
  resolved: '처리완료',
  dismissed: '기각'
} as const

// 신고 상태 색상 매핑
export const REPORT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800'
} as const

export type ReportCreateData = z.infer<typeof ReportCreateSchema>
export type ReportUpdateData = z.infer<typeof ReportUpdateSchema>
export type ReportQueryData = z.infer<typeof ReportQuerySchema>
export type ReportResponseData = z.infer<typeof ReportResponseSchema>
export type ReportListResponseData = z.infer<typeof ReportListResponseSchema>
export type ReportReason = z.infer<typeof ReportReasonSchema>
export type ReportStatus = z.infer<typeof ReportStatusSchema>
export type TargetType = z.infer<typeof TargetTypeSchema>
