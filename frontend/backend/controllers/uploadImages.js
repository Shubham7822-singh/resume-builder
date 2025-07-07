import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Resume from '../models/resumeModel.js';

// Create uploads folder if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 1. Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 2. File filter to allow only image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({ storage, fileFilter });

// 3. Controller function
export const uploadResumeImage = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (req.files.thumbnail) {
      const thumbnailPath = `/uploads/${req.files.thumbnail[0].filename}`;
      resume.thumbnailLink = thumbnailPath;
    }

    if (req.files.profilePreview) {
      const profilePath = `/uploads/${req.files.profilePreview[0].filename}`;
      resume.profileInfo.profilePreviewUrl = profilePath;
    }

    const updated = await resume.save();
    res.json(updated);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
