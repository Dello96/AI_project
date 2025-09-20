// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'member' | 'leader' | 'admin';
  avatarUrl?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
  provider?: string; // OAuth 제공자 (google, kakao, email 등)
}

// 게시글 관련 타입
export interface Post {
  id: string;
  title: string;
  content: string;
  category: 'notice' | 'free' | 'qna';
  authorId: string;
  author?: User;
  isAnonymous: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  userLiked?: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
  attachments?: string[];
  deletedAt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 댓글 관련 타입
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: User;
  content: string;
  isAnonymous: boolean;
  parentId?: string | null; // 대댓글 지원
  likeCount?: number; // 좋아요 수
  createdAt: Date;
  updatedAt: Date;
}

// 일정 관련 타입
export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  category: 'worship' | 'meeting' | 'event' | 'smallgroup';
  isAllDay: boolean;
  authorId: string;
  author?: User;
  // churchDomain 제거됨 (단순화)
  createdAt: Date;
  updatedAt: Date;
}

// 알림 관련 타입
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'post' | 'event' | 'system';
  isRead: boolean;
  relatedId?: string;
  createdAt: Date;
}

// 파일 관련 타입
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedByUser?: User;
  createdAt: Date;
}

// 캘린더 관련 타입
export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  currentDate: Date;
}

export interface CalendarFilters {
  categories: string[];
  searchTerm: string;
  showPastEvents: boolean;
}

// 이벤트 카테고리
export const eventCategories = [
  { value: 'worship', label: '예배', color: 'bg-blue-500' },
  { value: 'meeting', label: '모임', color: 'bg-green-500' },
  { value: 'event', label: '행사', color: 'bg-purple-500' },
  { value: 'smallgroup', label: '소그룹', color: 'bg-orange-500' },
];

// 게시글 카테고리
export const postCategories = [
  { value: 'notice', label: '공지사항', color: 'bg-red-500' },
  { value: 'free', label: '자유게시판', color: 'bg-blue-500' },
  { value: 'qna', label: 'Q&A', color: 'bg-green-500' },
];

// 사용자 역할 타입
export type UserRole = 'member' | 'leader' | 'admin'

// 사용자 역할
export const userRoles = [
  { value: 'member', label: '일반회원', color: 'bg-gray-500' },
  { value: 'leader', label: '리더', color: 'bg-blue-500' },
  { value: 'admin', label: '관리자', color: 'bg-red-500' },
];

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 인증 관련 타입
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// 폼 관련 타입
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
  // churchDomain 제거됨 (단순화)
}

// 임시 회원가입 요청 관련 타입
export interface PendingMember {
  id: string;
  email: string;
  name: string;
  phone?: string;
  // churchDomainId 제거됨 (단순화)
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  rejectionNotes?: string;
  approvedBy?: string;
  rejectedBy?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignupRequestForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
  // churchDomain 제거됨 (단순화)
}

export interface PostForm {
  title: string;
  content: string;
  category: string;
  isAnonymous: boolean;
  attachments?: string[];
}

export interface EventForm {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  category: string;
  isAllDay: boolean;
}

export interface CommentForm {
  content: string;
  isAnonymous: boolean;
}

// 검색 및 필터 타입
export interface SearchFilters {
  searchTerm: string;
  category?: string;
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// UI 상태 타입
export interface UiState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export interface ModalState {
  isOpen: boolean;
  type: 'login' | 'signup' | 'post' | 'event' | 'profile' | 'payment' | null;
  data?: any;
}

export interface SearchResult {
  id: string;
  type: 'post' | 'event' | 'user';
  title: string;
  content?: string;
  author?: string;
  createdAt: Date;
  url: string;
}

export interface SearchFilters {
  searchTerm: string;
  type: 'all' | 'post' | 'event' | 'user';
  category?: string | undefined;
  dateRange?: {
    start: Date;
    end: Date;
  } | undefined;
}

// AI 챗봇 관련 타입
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatBotConfig {
  isOpen: boolean;
  isMinimized: boolean;
  theme: 'light' | 'dark';
  position: 'bottom-right' | 'bottom-left';
}
