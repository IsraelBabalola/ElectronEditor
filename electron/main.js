const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadURL('http://localhost:5173');
}

ipcMain.handle('fetch-folders', async (event, url) => {
    const ipv4Url = url.replace('localhost', '127.0.0.1'); 
    try {
        const response = await axios.get(ipv4Url); 
        return response.data;
    } catch (error) {
        console.error("Error in main process fetch-folders:", error.message); 
        throw new Error("Failed to fetch data from API in main process."); 
    }
});

ipcMain.handle('fetch-images', async (event, url, imageType) => {
    const ipv4Url = url.replace('localhost', '127.0.0.1'); 
    try {
        if(imageType === "all"){
            const response = await axios.get(ipv4Url);
            return response.data;
        }else{
            const response = await axios.get(ipv4Url);
            const allImages = response.data;
            const filteredImages = allImages.filter(image => image.filepath.replace(".", "").toLowerCase().slice(-3) === imageType);
            return filteredImages;
        }
        
    } catch (error) {
        console.error("Error in main process fetch-images:", error.message);
        throw new Error("Failed to fetch image data from API in main process.");
    }
});

ipcMain.handle('fetch-images-size', async (event, url, sizeFilter) => {
    const ipv4Url = url.replace('localhost', '127.0.0.1');
    try {
        const response = await axios.get(ipv4Url);
        const allImages = response.data;
        const sortedImages = [...allImages].sort((a, b) => {
            const sizeA = parseInt(a.filesize, 10);
            const sizeB = parseInt(b.filesize, 10);
            return sizeB - sizeA;
        });

            const count = Math.ceil(allImages.length / 2);
        if(sizeFilter === "G50"){
            return sortedImages.slice(0, count);
        }else{
            return sortedImages.slice(count, sortedImages.length);
        }

    }catch (error) {
        console.error("Error in main process fetch-images-size:", error.message);
        throw new Error("Failed to fetch image data by size from API in main process.");
    }
});

const copyFileToDestination = (sourcePath, destFolder) => {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(sourcePath);
        const destinationPath = path.join(destFolder, fileName);
        const sourcePath2 = path.join("C:\\Users\\israe\\Projects\\electron-image-editor\\server\\storage", fileName);
        fs.copyFile(sourcePath2, destinationPath, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

ipcMain.handle('start-batch-download', async (event, imagePaths) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select a download folder'
    });

    if (canceled || filePaths.length === 0) {
        return 'Download canceled by user.';
    }
    const destinationFolder = filePaths[0];
    
    try {
        await Promise.all(imagePaths.map(sourcePath => 
            copyFileToDestination(sourcePath, destinationFolder)
        ));
        return `Successfully downloaded ${imagePaths.length} files to ${destinationFolder}`;
    } catch (error) {
        console.error("Error in main process start-batch-download:", error.message);
        throw new Error("Failed to start batch download in main process.");
    }
});


ipcMain.handle('upload-files', async (event, url, filePaths) => {
    const ipv4Url = url.replace('localhost', '127.0.0.1');

    try {
        const form = new FormData();
        filePaths.forEach(filePath => {
            const fileStream = fs.createReadStream(filePath);
            form.append('files', fileStream); 
        });

        const response = await axios.post(ipv4Url, form, {
            headers: form.getHeaders(), 
        });

        return response.data;
    } catch (error) {
        console.error("Error in main process upload-files:", error.message);
        throw new Error("Failed to upload files to API in main process.");
    }
});

ipcMain.handle('upload-files-from-folder', async (event, url, folderPath, allowedTypes, recursive) => {
    const ipv4Url = url.replace('localhost', '127.0.0.1');

    try {
        const form = new FormData();
        const files = fs.readdirSync(folderPath);
        const filtered = files.filter(f => {
            const ext = path.extname(f).replace(".", "").toLowerCase();
            return allowedTypes.includes(ext);
        });
        filtered.forEach(filename => {
            const fullPath = path.join(folderPath, filename);
            const fileStream = fs.createReadStream(fullPath);
            form.append('files', fileStream); 
        });
        const response = await axios.post(ipv4Url, form, {
            headers: form.getHeaders(), 
        });
        return response.data;
    } catch (error) {
        console.error("Yo gang error here:", error.message);
        throw new Error("Failed to upload files from folder to API in main process.");
    }
});


ipcMain.handle('upload-cropped-blob', async (event, url, blobBuffer, filename) => {
    const ipv4Url = url.replace('localhost', '127.0.0.1');
    const tempDir = app.getPath('temp');
    const tempFilePath = path.join(tempDir, filename);

    try {
        fs.writeFileSync(tempFilePath, Buffer.from(blobBuffer));
        console.log(`Saved temporary file to: ${tempFilePath}`);


        const form = new FormData();
        const fileStream = fs.createReadStream(tempFilePath);
        form.append('files', fileStream, filename); 
        const response = await axios.post(ipv4Url, form, {
            headers: form.getHeaders(), 
        });

        fs.unlinkSync(tempFilePath);
        console.log(`Cleaned up temporary file: ${tempFilePath}`);

        return response.data;
        
    } catch (error) {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error("Error in main process upload-cropped-blob:", error.message);
        throw new Error("Failed to upload cropped image in main process.");
    }
});

ipcMain.handle('delete-image', async (event, url) => {
  const ipv4Url = url.replace('localhost', '127.0.0.1');
    try { 
        await axios.delete(ipv4Url);
        return `Successfully deleted ${url}`; 
    } catch (error) {
        console.error("Error in main process delete-image:", error.message);
        throw new Error("Failed to delete image from API in main process.");
    }
});




app.whenReady().then(createWindow);
