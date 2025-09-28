'use client'

import { create } from 'zustand'
import { User } from '@/types'

interface PermissionsStore {
  // State
  user: User | null
  
  // Actions
  setUser: (user: User | null) => void
  canCreatePost: () => boolean
  canEditPost: (authorId: string) => boolean
  canDeletePost: (authorId: string) => boolean
  canCreateEvent: () => boolean
  canEditEvent: (authorId: string) => boolean
  canDeleteEvent: (authorId: string) => boolean
  canManageUsers: () => boolean
  canApproveUsers: () => boolean
  canAccessAdmin: () => boolean
  canModerateContent: () => boolean
  canViewAnalytics: () => boolean
  canManageSettings: () => boolean
  isAdmin: () => boolean
  isLeader: () => boolean
  isMember: () => boolean
  isApproved: () => boolean
}

export const usePermissionsStore = create<PermissionsStore>((set, get) => ({
  // Initial state
  user: null,

  // Actions
  setUser: (user) => {
    set({ user })
  },

  canCreatePost: () => {
    const { user } = get()
    return !!(user && user.isApproved)
  },

  canEditPost: (authorId: string) => {
    const { user } = get()
    if (!user) return false
    
    // 본인 글 또는 관리자/리더
    return user.id === authorId || user.role === 'admin' || user.role === 'leader'
  },

  canDeletePost: (authorId: string) => {
    const { user } = get()
    if (!user) return false
    
    // 본인 글 또는 관리자
    return user.id === authorId || user.role === 'admin'
  },

  canCreateEvent: () => {
    const { user } = get()
    return !!(user && user.isApproved && (user.role === 'admin' || user.role === 'leader'))
  },

  canEditEvent: (authorId: string) => {
    const { user } = get()
    if (!user) return false
    
    // 본인 이벤트 또는 관리자
    return user.id === authorId || user.role === 'admin'
  },

  canDeleteEvent: (authorId: string) => {
    const { user } = get()
    if (!user) return false
    
    // 본인 이벤트 또는 관리자
    return user.id === authorId || user.role === 'admin'
  },

  canManageUsers: () => {
    const { user } = get()
    return !!(user && user.role === 'admin')
  },

  canApproveUsers: () => {
    const { user } = get()
    return !!(user && user.role === 'admin')
  },

  canAccessAdmin: () => {
    const { user } = get()
    return !!(user && user.role === 'admin')
  },

  canModerateContent: () => {
    const { user } = get()
    return !!(user && (user.role === 'admin' || user.role === 'leader'))
  },

  canViewAnalytics: () => {
    const { user } = get()
    return !!(user && user.role === 'admin')
  },

  canManageSettings: () => {
    const { user } = get()
    return !!(user && user.role === 'admin')
  },

  isAdmin: () => {
    const { user } = get()
    return !!(user && user.role === 'admin')
  },

  isLeader: () => {
    const { user } = get()
    return !!(user && user.role === 'leader')
  },

  isMember: () => {
    const { user } = get()
    return !!(user && user.role === 'member')
  },

  isApproved: () => {
    const { user } = get()
    return !!(user && user.isApproved)
  }
}))
