import multer from 'multer'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req,file, cb) => {
        cb(null, `${Date.now()}-${originalname}`)
    },
});

const fileFilter = (req,file,cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.minetype)) {
        cb(null, true)
    } else {
        cb(new Error('Only .jpg, .jpeg, .png are allowed format'). false)
    }
}
const upload = multer({storage, fileFilter})
export default upload;