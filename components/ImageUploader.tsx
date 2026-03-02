'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import axios from 'axios'

interface Detection {
  class: string
  conf: number | null
}

interface PredictionResult {
  detections: Detection[]
  imagedetect: string
}

interface Props {
  onPrediction: (result: PredictionResult) => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
}

// ❗ ใช้ ENV เท่านั้น (ห้าม fallback localhost บน production)
const API_URL = process.env.NEXT_PUBLIC_API_URL!

export default function ImageUploader({ onPrediction, onError, onLoadingChange }: Props) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg']

    if (!validTypes.includes(file.type)) {
      onError('กรุณาอัปโหลดไฟล์ PNG, JPG หรือ JPEG เท่านั้น')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('ไฟล์ใหญ่เกินไป (สูงสุด 10MB)')
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      onError('กรุณาเลือกไฟล์ก่อน')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    onLoadingChange(true)
    onError('')

    try {
      const response = await axios.post<PredictionResult>(
        `${API_URL}/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      )

      onPrediction(response.data)
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        onError('ไม่สามารถเชื่อมต่อ Backend ได้')
      } else if (error.response) {
        onError(`Server Error: ${error.response.status}`)
      } else if (error.request) {
        onError('ไม่ได้รับการตอบกลับจาก Server (อาจเป็น CORS)')
      } else {
        onError(error.message)
      }

      console.error('Upload error:', error)
    } finally {
      onLoadingChange(false)
    }
  }

  const handleReset = () => {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <div
        className={`upload-zone ${dragActive ? 'upload-zone-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleChange}
        />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-600 font-medium">
              {selectedFile?.name}
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-lg font-semibold">
              คลิกหรือวางไฟล์ที่นี่
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, JPEG (ไม่เกิน 10MB)
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          className="btn-primary flex-1"
        >
          ตรวจจับวัตถุ
        </button>

        {preview && (
          <button onClick={handleReset} className="btn-secondary">
            ล้าง
          </button>
        )}
      </div>
    </div>
  )
}