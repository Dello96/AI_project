'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ChurchDomain {
  id: string
  domain: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ChurchDomainsPage() {
  const { user } = useAuth()
  const [domains, setDomains] = useState<ChurchDomain[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDomain, setNewDomain] = useState({
    domain: '',
    name: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 교회 도메인 목록 조회
  const fetchDomains = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/church-domains', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setDomains(result.data)
        setError('')
      } else {
        setError(result.error || '교회 도메인 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('교회 도메인 조회 오류:', error)
      setError('교회 도메인 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 교회 도메인 추가
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newDomain.domain.trim() || !newDomain.name.trim()) {
      setError('도메인과 교회명을 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch('/api/admin/church-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(newDomain)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setNewDomain({ domain: '', name: '', description: '' })
        setShowAddForm(false)
        await fetchDomains() // 목록 새로고침
      } else {
        setError(result.error || '교회 도메인 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('교회 도메인 추가 오류:', error)
      setError('교회 도메인 추가 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDomains()
    }
  }, [user])

  // 관리자가 아닌 경우 접근 거부
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">교회 도메인 관리</h1>
            <p className="text-gray-600 mt-2">회원가입 시 선택할 수 있는 교회 목록을 관리합니다.</p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            교회 추가
          </Button>
        </div>

        {/* 교회 추가 폼 */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">새 교회 추가</h2>
                <form onSubmit={handleAddDomain} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        도메인 *
                      </label>
                      <Input
                        type="text"
                        placeholder="gracechurch"
                        value={newDomain.domain}
                        onChange={(e) => setNewDomain(prev => ({ ...prev, domain: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        교회명 *
                      </label>
                      <Input
                        type="text"
                        placeholder="은혜교회"
                        value={newDomain.name}
                        onChange={(e) => setNewDomain(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      설명
                    </label>
                    <Input
                      type="text"
                      placeholder="서울 강남구 소재 청년부"
                      value={newDomain.description}
                      onChange={(e) => setNewDomain(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      disabled={isSubmitting}
                    >
                      취소
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '추가 중...' : '추가'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {/* 교회 도메인 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain) => (
            <motion.div
              key={domain.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
                      <p className="text-sm text-gray-500">@{domain.domain}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {domain.description && (
                    <p className="text-sm text-gray-600 mb-4">{domain.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded-full ${
                      domain.is_active 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {domain.is_active ? '활성' : '비활성'}
                    </span>
                    <span>{new Date(domain.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {domains.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">등록된 교회가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">새 교회를 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
