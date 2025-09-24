// 캘린더 관련 타입 정의
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

// 이벤트 관련 타입
export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  category: 'worship' | 'meeting' | 'event' | 'smallgroup' | 'vehicle';
  isAllDay: boolean;
  authorId: string;
  author?: User;
  churchDomain?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 사용자 타입 (간단한 버전)
export interface User {
  id: string;
  email: string;
  name: string;
}

// 이벤트 카테고리 (데이터베이스 스키마와 일치)
export const eventCategories = [
  { value: 'worship', label: '예배', color: '#3b82f6' },
  { value: 'meeting', label: '모임', color: '#10b981' },
  { value: 'event', label: '행사', color: '#8b5cf6' },
  { value: 'smallgroup', label: '소그룹', color: '#f59e0b' },
  { value: 'vehicle', label: '차량사용', color: '#ef4444' },
];
