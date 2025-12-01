import express from "express";
import multer from "multer";
import pool from "../db.js";
import fs from 'fs'; 
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/usr/src/app/storage/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post("/upload", upload.array("files", 10), async (req, res) => {
  let feedback = {
    totalFileCount: 0,
    totalFileSize: 0,
    corruptedImageCount: 0,
    success: false,
  };

  try {
    const files = req.files;

    if (!files || files.length === 0) {
        feedback.corruptedImageCount = 1;
        return res.status(400).json(feedback);
    }

    let successfullyUploadedCount = 0;

    const insertPromises = files.map(async (file) => {
        try {
            const query = `
              INSERT INTO images (filename, filepath, filetype, filesize)
              VALUES ($1, $2, $3, $4) RETURNING *;
            `;
            const values = [file.originalname, file.path, file.mimetype, file.size];
            await pool.query(query, values);
            feedback.totalFileSize += file.size;
            successfullyUploadedCount += 1;

        } catch (error) {
            console.error("Database error for file:", file.originalname, error);
            feedback.corruptedImageCount += 1;
        }
    });
    await Promise.all(insertPromises);

    feedback.totalFileCount = successfullyUploadedCount;
    feedback.success = successfullyUploadedCount > 0;
    res.json(feedback);
    
  } catch (error) {
    console.error(error);
    feedback.corruptedImageCount = feedback.corruptedImageCount || 0 + 1; 
    res.status(500).json(feedback);
  }
});

router.get("/", async (req, res) => {
  const result = await pool.query("SELECT * FROM images ORDER BY id DESC");
  res.json(result.rows);
});

/**
 * @route DELETE /images/:id
 * @desc Delete an image record and the physical file
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const imageResult = await pool.query('SELECT filepath FROM images WHERE id = $1', [id]);
        if (imageResult.rows.length === 0) {
            return res.status(404).send('Image not found.');
        }
        const filePath = imageResult.rows[0].filepath;
        await pool.query('DELETE FROM images WHERE id = $1', [id]);
        fs.unlinkSync(filePath); 

        res.status(200).send(`Image ${id} deleted successfully.`);

    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).send('Server Error deleting image.');
    }
});

/**
 * @route PUT /images/:id
 * @desc Update image metadata (e.g., rename file, change folder ID)
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { filename, folderId } = req.body;

    try {
        const result = await pool.query(
            'UPDATE images SET filename = $1, folder_id = $2 WHERE id = $3 RETURNING *',
            [filename, folderId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Image not found for update.');
        }

        res.status(200).json({ success: true, updatedImage: result.rows[0] });

    } catch (error) {
        console.error("Error updating image:", error);
        res.status(500).send('Server Error updating image metadata.');
    }
});

export default router;
