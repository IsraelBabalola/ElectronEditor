import express from "express";
import imagesRouter from "./routes/images.js";
import foldersRouter from "./routes/folders.js";
import fs from "fs";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[DEBUG] Request to ${req.url}`);
  res.on('finish', () => {
    console.log(`[DEBUG] Response Headers:`, res.getHeaders());
  });
  next();
});

app.use('/storage', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static('/usr/src/app/storage'));

try {
    const storagePath = '/usr/src/app/storage';
    const files = fs.readdirSync(storagePath);
    console.log(`[DIAGNOSTIC] Successfully read storage directory. Files found: ${files.length}`);
    console.log(`[DIAGNOSTIC] First file name: ${files[0]}`);
} catch (error) {
    console.error(`[DIAGNOSTIC ERROR] Failed to read storage directory: ${error.message}`);
}

app.use("/images", imagesRouter);
app.use("/folders", foldersRouter);

const PORT = 3001;
const HOST = '0.0.0.0'; 

app.listen(PORT, HOST, () => {
  console.log(`API server running on http://${HOST}:${PORT}`);
});
