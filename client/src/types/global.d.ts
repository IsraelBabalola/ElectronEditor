declare global {
  interface Window {
    api: {
      fetchFolders: () => Promise<Folder[]>;
      fetchImages: (imageType: string) => Promise<ImageMetadata[]>;
      fetchImagesBySize: (sizeFilter: string) => Promise<ImageMetadata[]>;
      startBatchDownload: (imagePaths: string[]) => Promise<void>;
      uploadFiles: (files: string[]) => Promise<Feedback>; 
      uploadFolders: (folders: string) => Promise<Feedback>;
      uploadCroppedImage: (url: string, buffer: ArrayBuffer, filename: string) => Promise<Feedback>;
      deleteImage: (imageId: number) => Promise<void>;
    };
  }

  interface FolderUpload{
    folderPath: string;
    allowedTypes: ["png", "jpg", "tif"];
    recursive: true;
  }

  interface Folder {
    id: number;
    name: string;
  }

  interface ImageMetadata {
  id: number;
  filename: string;
  filepath: string;    
  filetype: string;
  filesize: string;
  width: number | null;
  height: number | null;
  folder_id: number | null;
  created_at: string;
}
  interface Feedback {
    totalFileCount: number;
    totalFileSize: number;
    corruptedImageCount: number;
    success: boolean;
  }
}

export {};
