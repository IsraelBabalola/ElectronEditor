const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    fetchFolders: () => ipcRenderer.invoke('fetch-folders', 'http://localhost:3001/folders'),
    fetchImages: (imageType) => ipcRenderer.invoke('fetch-images', 'http://localhost:3001/images', imageType),
    fetchImagesBySize: (sizeFilter) => ipcRenderer.invoke('fetch-images-size', 'http://localhost:3001/images', sizeFilter),
    startBatchDownload: (imagePaths) => ipcRenderer.invoke('start-batch-download', imagePaths),
    uploadFiles: (files) => ipcRenderer.invoke('upload-files', 'http://localhost:3001/images/upload', files),
    uploadFolders: (folders) => ipcRenderer.invoke('upload-files-from-folder', 'http://localhost:3001/images/upload', folders, ["png", "jpg", "tif"], true),
    uploadCroppedImage: (url, buffer, filename) => ipcRenderer.invoke('upload-cropped-blob', url, buffer, filename),
    deleteImage: (imageId) => ipcRenderer.invoke('delete-image', `http://localhost:3001/images/${imageId}`)
});
