import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createResume,
  deleteResume,
  getResumeById,
  getUserResumes,
  updateResume,
} from '../controllers/resumeController.js';
import {
  uploadResumeImage,
  upload
} from '../controllers/uploadImages.js';

const resumeRouter = express.Router();

resumeRouter.post('/', protect, createResume);
resumeRouter.get('/', protect, getUserResumes);
resumeRouter.get('/:id', protect, getResumeById);
resumeRouter.put('/:id', protect, updateResume);

// 🔥 Multer fields middleware
resumeRouter.put(
  '/:id/upload-image',
  protect,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'profilePreview', maxCount: 1 }
  ]),
  uploadResumeImage
);

resumeRouter.delete('/:id', protect, deleteResume);

export default resumeRouter;
