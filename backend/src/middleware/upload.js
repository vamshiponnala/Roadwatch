// middleware/upload.js
const multer   = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path     = require("path");
const { v4: uuid } = require("uuid");
 
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: { accessKeyId:process.env.AWS_ACCESS_KEY_ID, secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY },
});
 
module.exports = multer({
  storage: multerS3({
    s3: s3Client, bucket: process.env.AWS_S3_BUCKET, acl:"private",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const folder = file.mimetype.startsWith("video") ? "videos" : "photos";
      cb(null, `evidence/${folder}/${req.user.id}/${uuid()}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 50*1024*1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/webp","video/mp4","video/quicktime"];
    allowed.includes(file.mimetype) ? cb(null,true) : cb(new Error("Invalid file type"),false);
  },
});
 
// ─────────────────────────────────────────────────────────────────────────────
