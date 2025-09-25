'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheckIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  Permission, 
  PermissionGroup, 
  ResourceType, 
  ActionType,
  permissionManager 
} from '@/lib/permissions'
import { permissionAuditManager } from '@/lib/permission-audit'
import { useToast } from '@/components/ui/Toast'

interface PermissionManagerProps {
  className?: string
}

export default function PermissionManager({ className = '' }: PermissionManagerProps) {
  const { user } = useAuth()
  const permissions = usePermissions()
  const toast = useToast()
  
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<any[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    permissions: [] as Permission[]
  })

  // 리소스 및 액션 옵션
  const resourceOptions = [
    { value: 'post', label: '게시판' },
    { value: 'event', label: '일정' },
    { value: 'user', label: '사용자' },
    { value: 'comment', label: '댓글' },
    { value: 'file', label: '파일' },
    { value: 'notification', label: '알림' },
    { value: 'system', label: '시스템' }
  ]

  const actionOptions = [
    { value: 'create', label: '생성' },
    { value: 'read', label: '읽기' },
    { value: 'update', label: '수정' },
    { value: 'delete', label: '삭제' },
    { value: 'moderate', label: '관리' },
    { value: 'approve', label: '승인' },
    { value: 'manage', label: '관리' }
  ]

  useEffect(() => {
    if (user && permissions.canManageUsers()) {
      loadUsers()
      loadPermissionGroups()
    }
  }, [user, permissions])

  // 사용자 목록 로드
  const loadUsers = async () => {
    try {
      // 실제 구현에서는 API 호출
      const mockUsers = [
        { id: '1', name: '김철수', email: 'kim@example.com', role: 'member', isApproved: true },
        { id: '2', name: '이영희', email: 'lee@example.com', role: 'leader', isApproved: true },
        { id: '3', name: '박민수', email: 'park@example.com', role: 'admin', isApproved: true }
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error)
      toast.showError('사용자 목록을 불러올 수 없습니다.')
    }
  }

  // 권한 그룹 로드
  const loadPermissionGroups = async () => {
    try {
      // 실제 구현에서는 API 호출
      const mockGroups: PermissionGroup[] = [
        {
          id: '1',
          name: '게시판 관리자',
          description: '게시판 관련 모든 권한',
          permissions: [
            { resource: 'post', action: 'create' },
            { resource: 'post', action: 'read' },
            { resource: 'post', action: 'update' },
            { resource: 'post', action: 'delete' },
            { resource: 'post', action: 'moderate' }
          ],
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      setPermissionGroups(mockGroups)
    } catch (error) {
      console.error('권한 그룹 로드 오류:', error)
      toast.showError('권한 그룹을 불러올 수 없습니다.')
    }
  }

  // 사용자 역할 변경
  const changeUserRole = async (userId: string, newRole: string, reason: string) => {
    try {
      // 실제 구현에서는 API 호출
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      )
      setUsers(updatedUsers)

      // 감사 로그 기록
      const user = users.find(u => u.id === userId)
      if (user) {
        permissionAuditManager.logRoleChange(
          userId,
          user.role,
          newRole as any,
          user.id,
          reason
        )
      }

      toast.showSuccess('사용자 역할이 변경되었습니다.')
    } catch (error) {
      console.error('역할 변경 오류:', error)
      toast.showError('역할 변경에 실패했습니다.')
    }
  }

  // 권한 그룹 생성
  const createPermissionGroup = async () => {
    try {
      if (!newGroup.name || !newGroup.description) {
        toast.showError('그룹명과 설명을 입력해주세요.')
        return
      }

      const group = permissionManager.createGroup({
        ...newGroup,
        isSystem: false
      })
      setPermissionGroups(prev => [...prev, group])
      
      // 감사 로그 기록
      permissionAuditManager.logGroupCreated(
        group.id,
        group.name,
        user?.id || '',
        group.permissions
      )

      setNewGroup({ name: '', description: '', permissions: [] })
      setIsCreatingGroup(false)
      toast.showSuccess('권한 그룹이 생성되었습니다.')
    } catch (error) {
      console.error('그룹 생성 오류:', error)
      toast.showError('그룹 생성에 실패했습니다.')
    }
  }

  // 권한 그룹 수정
  const updatePermissionGroup = async () => {
    try {
      if (!selectedGroup) return

      const updatedGroups = permissionGroups.map(g =>
        g.id === selectedGroup.id ? { ...g, ...newGroup, updatedAt: new Date() } : g
      )
      setPermissionGroups(updatedGroups)

      // 감사 로그 기록
      permissionAuditManager.logGroupModified(
        selectedGroup.id,
        selectedGroup.name,
        user?.id || '',
        newGroup
      )

      setSelectedGroup(null)
      setIsEditingGroup(false)
      setNewGroup({ name: '', description: '', permissions: [] })
      toast.showSuccess('권한 그룹이 수정되었습니다.')
    } catch (error) {
      console.error('그룹 수정 오류:', error)
      toast.showError('그룹 수정에 실패했습니다.')
    }
  }

  // 권한 그룹 삭제
  const deletePermissionGroup = async (groupId: string) => {
    try {
      if (!confirm('정말로 이 권한 그룹을 삭제하시겠습니까?')) return

      const updatedGroups = permissionGroups.filter(g => g.id !== groupId)
      setPermissionGroups(updatedGroups)
      toast.showSuccess('권한 그룹이 삭제되었습니다.')
    } catch (error) {
      console.error('그룹 삭제 오류:', error)
      toast.showError('그룹 삭제에 실패했습니다.')
    }
  }

  // 권한 추가
  const addPermission = () => {
    setNewGroup(prev => ({
      ...prev,
      permissions: [...prev.permissions, { resource: 'post', action: 'read' }]
    }))
  }

  // 권한 제거
  const removePermission = (index: number) => {
    setNewGroup(prev => ({
      ...prev,
      permissions: prev.permissions.filter((_, i) => i !== index)
    }))
  }

  // 권한 변경
  const updatePermission = (index: number, field: 'resource' | 'action', value: string) => {
    setNewGroup(prev => ({
      ...prev,
      permissions: prev.permissions.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }))
  }

  if (!user || !permissions.canManageUsers()) {
    return (
      <div className="text-center py-8">
        <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">권한 관리에 접근할 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">권한 관리</h1>
          <p className="text-gray-600">사용자 권한과 역할을 관리합니다</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'users', label: '사용자 관리', icon: UserGroupIcon },
            { id: 'groups', label: '권한 그룹', icon: Cog6ToothIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-church-purple text-church-purple'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 사용자 관리 탭 */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 사용자 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>사용자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        역할
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'leader' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? '관리자' :
                             user.role === 'leader' ? '리더' : '일반회원'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.isApproved ? '승인됨' : '대기중'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                          >
                            권한 관리
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 권한 그룹 탭 */}
      {activeTab === 'groups' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 그룹 생성/수정 폼 */}
          {(isCreatingGroup || isEditingGroup) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreatingGroup ? '새 권한 그룹 생성' : '권한 그룹 수정'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="그룹명"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="설명"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* 권한 목록 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">권한 설정</h4>
                    <Button size="sm" onClick={addPermission}>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      권한 추가
                    </Button>
                  </div>
                  
                  {newGroup.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Select
                        value={permission.resource}
                        onValueChange={(value) => updatePermission(index, 'resource', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="리소스 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={permission.action}
                        onValueChange={(value) => updatePermission(index, 'action', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="액션 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {actionOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePermission(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={isCreatingGroup ? createPermissionGroup : updatePermissionGroup}
                    className="flex-1"
                  >
                    {isCreatingGroup ? '그룹 생성' : '그룹 수정'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingGroup(false)
                      setIsEditingGroup(false)
                      setNewGroup({ name: '', description: '', permissions: [] })
                    }}
                  >
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 그룹 생성 버튼 */}
          {!isCreatingGroup && !isEditingGroup && (
            <Button onClick={() => setIsCreatingGroup(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              새 권한 그룹
            </Button>
          )}

          {/* 권한 그룹 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissionGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedGroup(group)
                          setNewGroup({
                            name: group.name,
                            description: group.description,
                            permissions: group.permissions
                          })
                          setIsEditingGroup(true)
                        }}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePermissionGroup(group.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{group.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">권한:</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.permissions.map((permission, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {resourceOptions.find(r => r.value === permission.resource)?.label} - 
                          {actionOptions.find(a => a.value === permission.action)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* 사용자 권한 관리 모달 */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium mb-4">
                {selectedUser.name} 권한 관리
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    역할 변경
                  </label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => {
                      const reason = prompt('역할 변경 사유를 입력해주세요:')
                      if (reason) {
                        changeUserRole(selectedUser.id, value, reason)
                        setSelectedUser(null)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="역할 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">일반회원</SelectItem>
                      <SelectItem value="leader">리더</SelectItem>
                      <SelectItem value="admin">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                    className="flex-1"
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast 컨테이너 */}
      <div className="fixed top-4 right-4 z-50">
        {toast.toasts.map((toastItem) => (
          <div key={toastItem.id} className="mb-2">
            {/* Toast 컴포넌트 렌더링 */}
          </div>
        ))}
      </div>
    </div>
  )
}
