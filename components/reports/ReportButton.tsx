'use client'

import { useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import ReportModal from './ReportModal'

interface ReportButtonProps {
  targetType: 'post' | 'comment'
  targetId: string
  targetTitle?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export default function ReportButton({
  targetType,
  targetId,
  targetTitle,
  variant = 'outline',
  size = 'sm',
  className
}: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReported, setIsReported] = useState(false)

  const handleReportSuccess = () => {
    setIsReported(true)
    // 3초 후 버튼 상태 초기화
    setTimeout(() => {
      setIsReported(false)
    }, 3000)
  }

  return (
    <>
      <Button
        variant={isReported ? 'ghost' : variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        disabled={isReported}
        className={`${className} ${isReported ? 'text-green-600' : 'text-red-600 hover:text-red-700'}`}
      >
        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
        {isReported ? '신고완료' : '신고'}
      </Button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleReportSuccess}
        targetType={targetType}
        targetId={targetId}
        targetTitle={targetTitle || '제목 없음'}
      />
    </>
  )
}
