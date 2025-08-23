import { supabase } from './supabase'
import { FileWithPreview } from '@/components/ui/FileUpload'

export interface UploadedFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  bucket: string
  path: string
}

export interface FileUploadResult {
  success: boolean
  files?: UploadedFile[]
  error?: string
}

class FileUploadService {
  private bucket = 'community-files'

  /**
   * 파일을 Supabase Storage에 업로드
   */
  async uploadFiles(files: FileWithPreview[], folder: string = 'general'): Promise<FileUploadResult> {
    try {
      const uploadedFiles: UploadedFile[] = []
      
      for (const file of files) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`
        const filePath = `${folder}/${fileName}`
        
        const { data, error } = await supabase.storage
          .from(this.bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('파일 업로드 오류:', error)
          return {
            success: false,
            error: `파일 ${file.name} 업로드 실패: ${error.message}`
          }
        }

        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from(this.bucket)
          .getPublicUrl(filePath)

        uploadedFiles.push({
          id: data.id,
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
          bucket: this.bucket,
          path: filePath
        })
      }

      return {
        success: true,
        files: uploadedFiles
      }
    } catch (error) {
      console.error('파일 업로드 서비스 오류:', error)
      return {
        success: false,
        error: '파일 업로드 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([filePath])

      if (error) {
        console.error('파일 삭제 오류:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('파일 삭제 서비스 오류:', error)
      return false
    }
  }

  /**
   * 여러 파일 삭제
   */
  async deleteFiles(filePaths: string[]): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove(filePaths)

      if (error) {
        console.error('파일들 삭제 오류:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('파일들 삭제 서비스 오류:', error)
      return false
    }
  }

  /**
   * 파일 목록 조회
   */
  async listFiles(folder: string = 'general'): Promise<UploadedFile[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list(folder)

      if (error) {
        console.error('파일 목록 조회 오류:', error)
        return []
      }

      return data.map(file => ({
        id: file.id,
        name: file.name,
        url: '', // URL은 별도로 생성해야 함
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || '',
        bucket: this.bucket,
        path: `${folder}/${file.name}`
      }))
    } catch (error) {
      console.error('파일 목록 조회 서비스 오류:', error)
      return []
    }
  }

  /**
   * 파일 크기 검증
   */
  validateFileSize(file: File, maxSizeMB: number): boolean {
    return file.size <= maxSizeMB * 1024 * 1024
  }

  /**
   * 파일 타입 검증
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })
  }

  /**
   * 이미지 리사이징 (클라이언트 사이드)
   */
  async resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 600): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        // 비율 유지하면서 리사이징
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            resolve(file)
          }
        }, file.type, 0.8)
      }

      img.src = URL.createObjectURL(file)
    })
  }
}

export const fileUploadService = new FileUploadService()
