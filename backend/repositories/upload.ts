import { USE_MOCK_DATA, generateId } from '../db';
import { z } from 'zod';

const insertUploadSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  s3Key: z.string().min(1),
  s3Url: z.string().min(1),
  uploadId: z.string().min(1),
  status: z.string().optional(),
});

interface Upload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  s3Key: string;
  s3Url: string;
  uploadId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const mockUploads: Upload[] = [];

export class UploadRepository {
  async create(uploadData: z.infer<typeof insertUploadSchema>) {
    if (USE_MOCK_DATA) {
      const upload: Upload = {
        id: generateId(),
        fileName: uploadData.fileName,
        fileSize: 0,
        fileType: uploadData.fileType,
        s3Key: uploadData.s3Key,
        s3Url: uploadData.s3Url,
        uploadId: uploadData.uploadId,
        status: uploadData.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUploads.push(upload);
      return upload;
    }
    throw new Error('Database not configured');
  }

  async findById(id: string) {
    if (USE_MOCK_DATA) {
      return mockUploads.find(u => u.id === id) || undefined;
    }
    return undefined;
  }

  async updateStatus(id: string, status: string) {
    if (USE_MOCK_DATA) {
      const index = mockUploads.findIndex(u => u.id === id);
      if (index !== -1) {
        mockUploads[index].status = status;
        mockUploads[index].updatedAt = new Date();
        return mockUploads[index];
      }
    }
    return undefined;
  }

  async delete(id: string) {
    if (USE_MOCK_DATA) {
      const index = mockUploads.findIndex(u => u.id === id);
      if (index !== -1) {
        mockUploads.splice(index, 1);
      }
    }
  }
}

export const uploadRepository = new UploadRepository();
