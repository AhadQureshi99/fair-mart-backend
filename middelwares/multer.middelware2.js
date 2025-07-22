import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public");
  },
  filename: (req, file, cb) => {
    console.log("Multer file:", file);
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  console.log("File received:", file);
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(null, false); // Silently ignore non-image files
  }
};

export const newupload = multer({ storage: storage, fileFilter: fileFilter });
