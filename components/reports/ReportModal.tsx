'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { REPORT_REASON_LABELS, ReportReason } from '@/lib/report-schemas'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  targetType: 'post' | 'comment'
  targetId: string
  targetTitle?: string
}

export default function ReportModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  targetType, 
  targetId, 
  targetTitle 
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>('spam')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim()) {
      setError('신고 사유를 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description: description.trim()
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onSuccess()
        onClose()
        // 폼 초기화
        setReason('spam')
        setDescription('')
      } else {
        setError(result.error || '신고 접수에 실패했습니다.')
      }
    } catch (error) {
      console.error('신고 접수 오류:', error)
      setError('신고 접수 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setReason('spam')
      setDescription('')
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">신고하기</h2>
                <p className="text-sm text-gray-600">
                  {targetType === 'post' ? '게시글' : '댓글'}을 신고합니다
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 대상 정보 */}
          {targetTitle && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">신고 대상</p>
              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                {targetTitle}
              </p>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 신고 사유 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                신고 사유 *
              </label>
              <Select value={reason} onValueChange={(value: ReportReason) => setReason(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_REASON_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 상세 사유 입력 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                상세 사유 *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="신고 사유를 자세히 설명해주세요 (10자 이상)"
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                required
                minLength={10}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {description.length}/500자
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 신고된 내용은 검토 후 적절한 조치를 취하겠습니다. 
                허위 신고는 제재를 받을 수 있습니다.
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="destructive"
                loading={isLoading}
                disabled={isLoading || !description.trim() || description.length < 10}
                className="flex-1"
              >
                신고하기
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
