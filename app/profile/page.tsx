'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export default function ProfilePage() {
  const { user, isLoading, signOut } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    joinDate: '',
    role: 'user'
  })

  // 사용자 데이터가 로드되면 폼 데이터 업데이트
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '사용자',
        email: user.email || '',
        phone: user.phone || '',
        joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '',
        role: user.role || 'user'
      })
    }
  }, [user])

  const roleLabels = {
    user: '일반 사용자',
    leader: '리더',
    admin: '관리자'
  }

  const roleColors = {
    user: 'bg-autumn-peach text-autumn-coral',
    leader: 'bg-autumn-gold text-autumn-mustard',
    admin: 'bg-autumn-rose text-autumn-rust'
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    // 여기에 저장 로직 추가
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogout = async () => {
    if (confirm('정말 로그아웃하시겠습니까?')) {
      try {
        await signOut()
        // 로그아웃 후 홈페이지로 리다이렉트
        window.location.href = '/'
      } catch (error) {
        console.error('로그아웃 오류:', error)
        alert('로그아웃 중 오류가 발생했습니다.')
      }
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-autumn-peach via-autumn-cream to-autumn-beige flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-autumn-coral rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로딩 중...</h2>
          <p className="text-gray-600">프로필 정보를 불러오고 있습니다.</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 사용자
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-autumn-peach via-autumn-cream to-autumn-beige flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-autumn-coral rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircleIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">프로필을 보려면 먼저 로그인해주세요.</p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-autumn-coral text-white hover:bg-autumn-coral/90"
          >
            로그인하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-autumn-peach via-autumn-cream to-autumn-beige">
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">내정보</h1>
            <p className="text-gray-600">프로필 정보를 확인하고 수정할 수 있습니다.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 프로필 카드 */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 bg-gradient-autumn rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    {user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={formData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{formData.name}</h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleColors[formData.role as keyof typeof roleColors]} mb-4`}>
                    <ShieldCheckIcon className="w-4 h-4 mr-1" />
                    {roleLabels[formData.role as keyof typeof roleLabels]}
                  </span>
                  
                  {/* OAuth 로그인 정보 */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-center">
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      <span className="truncate">{formData.email}</span>
                    </div>
                    {user?.provider && (
                      <div className="text-xs text-gray-500">
                        {user.provider === 'google' && 'Google 계정으로 로그인'}
                        {user.provider === 'kakao' && '카카오 계정으로 로그인'}
                        {user.provider === 'email' && '이메일 계정으로 로그인'}
                        {!['google', 'kakao', 'email'].includes(user.provider) && `${user.provider} 계정으로 로그인`}
                      </div>
                    )}
                  </div>

                  {/* 로그아웃 버튼 */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      로그아웃
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 정보 수정 폼 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <UserCircleIcon className="w-5 h-5 mr-2" />
                      개인정보
                    </CardTitle>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="flex items-center"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSave}
                          className="flex items-center"
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          저장
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          className="flex items-center"
                        >
                          <XMarkIcon className="w-4 h-4 mr-1" />
                          취소
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="이름을 입력하세요"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{formData.name}</p>
                    )}
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                      이메일
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="이메일을 입력하세요"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{formData.email}</p>
                    )}
                  </div>

                  {/* 전화번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PhoneIcon className="w-4 h-4 inline mr-1" />
                      전화번호
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="전화번호를 입력하세요"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{formData.phone}</p>
                    )}
                  </div>

                  {/* 가입일 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      가입일
                    </label>
                    <p className="text-gray-900 py-2">{formData.joinDate}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-autumn-coral mb-2">12</div>
                <div className="text-sm text-gray-600">작성한 게시글</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-autumn-gold mb-2">45</div>
                <div className="text-sm text-gray-600">받은 좋아요</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-autumn-rust mb-2">8</div>
                <div className="text-sm text-gray-600">참여한 이벤트</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
