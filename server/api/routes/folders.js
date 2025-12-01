import express from 'express';
import pool from '../db.js';
import multer from 'multer';
import path from 'path';     

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/usr/src/app/storage/'); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); 
    }
});

const upload = multer({ storage: storage });

/**
 * @route POST /folders/upload
 * @desc Handle file uploads into a specific folder and save metadata to DB
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  console.log('Received file upload request');

  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const { filename, path: filepath, mimetype: filetype, size: filesize } = req.file;
  const folderId = 1;

  try {
    const query = `
      INSERT INTO images (filename, filepath, filetype, filesize, folder_id) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [filename, filepath, filetype, filesize, folderId];
    
    await pool.query(query, values);
    
    res.status(200).send('Upload successful and metadata saved.');

  } catch (error) {
    console.error("Database error during upload:", error);
    res.status(500).send('Error saving file metadata to database.');
  }
});

router.post('/', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).send('Folder name is required.');
    }

    try {
        const result = await pool.query(
            'INSERT INTO folders (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json({ success: true, newFolder: result.rows[0] });

    } catch (error) {
        console.error("Error creating folder:", error);
        res.status(500).send('Server Error creating folder.');
    }
});

/**
 * @route GET /folders
 * @desc Get a list of all available folders
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM folders ORDER BY name ASC;');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error fetching folders');
  }
});

/**
 * @route GET /folders/:id/sync
 * @desc Endpoint for the Control Panel sync functionality
 */
router.get('/:id/sync', async (req, res) => {
    const folderId = req.params.id;
    res.status(200).send(`Sync status for folder ${folderId}`);
});

/**
 * @route PUT /folders/:id
 * @desc Update a folder's name
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const result = await pool.query(
            'UPDATE folders SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Folder not found for update.');
        }

        res.status(200).json({ success: true, updatedFolder: result.rows[0] });

    } catch (error) {
        console.error("Error updating folder:", error);
        res.status(500).send('Server Error updating folder name.');
    }
});

/**
 * @route DELETE /folders/:id
 * @desc Delete a folder and all associated images (due to ON DELETE CASCADE in schema)
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM folders WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send('Folder not found for deletion.');
        }

        res.status(200).send(`Folder ${id} and associated images deleted successfully.`);

    } catch (error) {
        console.error("Error deleting folder:", error);
        res.status(500).send('Server Error deleting folder.');
    }
});

export default router;
