import multer from "multer";

const storage = multer.memoryStorage();

export const uploadResumePdf = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      callback(new Error("Only PDF files are allowed"));
      return;
    }

    callback(null, true);
  },
}).single("file");
