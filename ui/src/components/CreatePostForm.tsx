// src/components/CreatePostForm.tsx
import React, { useState, useRef } from 'react';
import apiClient, { type PostResponse, type CreatePostBase64Input } from '../api/client'; // 确保导入 CreatePostBase64Input
import { useAuth } from '../contexts/AuthContext';

interface CreatePostFormProps {
  onPostCreated: (newPost: PostResponse) => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 这个仍然有用，用于预览
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImageFile(file); // 存储 File 对象
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string); // Data URL 用于预览
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please select an image to post.');
      return;
    }
    if (!token) {
      setError('You must be logged in to create a post.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    // 使用 FileReader 将文件读取为 Base64
    const reader = new FileReader();
    reader.readAsDataURL(imageFile); // 读取为 Data URL (包含前缀)

    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        // 从 Data URL 中提取纯 Base64 数据
        // Data URL 格式: data:[<MIME type>];base64,<Actual Base64 Data>
        const base64Data = dataUrl.split(',')[1];

        if (!base64Data) {
          throw new Error('Could not extract Base64 data from image.');
        }

        const payload: CreatePostBase64Input = {
          imageBase64: base64Data,
          imageFileType: imageFile.type, // 从 File 对象获取 MIME 类型
          caption: caption,
        };

        const newPost = await apiClient.createPost(payload); // 调用修改后的 apiClient 方法
        onPostCreated(newPost);
        setCaption('');
        setImageFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // 重置文件输入框
        }
      } catch (err: any) {
        setError(err.message || 'Failed to create post. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    reader.onerror = (errorEvent) => {
      console.error("FileReader error:", errorEvent);
      setError('Failed to read the image file.');
      setIsSubmitting(false);
    };
  };

  // 表单的 JSX 部分保持不变
  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Create New Post</h3>
      {error && <p className="text-red-500 text-sm mb-3 p-2 bg-red-50 rounded border border-red-200">{error}</p>}
      
      <div className="mb-3">
        <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
        <input
          type="file"
          id="imageFile"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer"
          required
        />
      </div>

      {previewUrl && (
        <div className="mb-3">
          <img src={previewUrl} alt="Preview" className="max-h-60 w-auto rounded-md border border-gray-200" />
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">Caption (Optional)</label>
        <textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500 text-sm"
          rows={3}
        />
      </div>
      <button 
        type="submit" 
        disabled={isSubmitting || !imageFile}
        className="w-full bg-pink-500 text-white py-2 px-4 rounded-md hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-150 ease-in-out"
      >
        {isSubmitting ? 'Posting...' : 'Share Post'}
      </button>
    </form>
  );
};

export default CreatePostForm;