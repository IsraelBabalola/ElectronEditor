import React, { useState } from 'react';

interface UploadPanelProps {
  onFeedbackUpdate: (feedback: string) => void;
  onAddLog: (msg: string) => void;
}

const UploadPanel: React.FC<UploadPanelProps> = ({onFeedbackUpdate, onAddLog }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedFolders, setSelectedFolder] = useState<FolderUpload | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    if(event.target.files === null) return;
    setUploadStatus('');
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setSelectedFiles(event.dataTransfer.files);
      const searchOptions: string[] = ["png", "jpg", "tif", "jpeg", "tiff"];
      const containsAnyOptionCase: boolean = searchOptions.some(option => 
        event.dataTransfer.files[0].type.toLowerCase().includes(option.toLowerCase())
      );
      if(containsAnyOptionCase) return;
      
      const droppedFiles = event.dataTransfer.files;
      const file = droppedFiles[0] as File & { path: string };
      const folderUploadObj: FolderUpload = {
        folderPath: file.path,
        allowedTypes: ["png", "jpg", "tif"],
        recursive: true
      };
      setSelectedFolder(folderUploadObj);
      event.dataTransfer.clearData();
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (selectedFolders){
      const folderpath = selectedFolders.folderPath; 
      const feedback: Feedback = await window.api.uploadFolders(folderpath);

      if (feedback.success) {
            setUploadStatus(`✅ Success: Uploaded ${feedback.totalFileCount} file(s).`);
            onFeedbackUpdate(`✅ Success: Uploaded ${feedback.totalFileCount}, Total Size: ${feedback.totalFileSize}, Corrupted: ${feedback.corruptedImageCount} file(s).`);
            onAddLog(`✅ Success: Uploaded contents of ${feedback.totalFileCount} folder, Total Size: ${feedback.totalFileSize}, Corrupted: ${feedback.corruptedImageCount} file(s).`);
        } else if (feedback.corruptedImageCount > 0) {
            setUploadStatus(`⚠️ Warning: Issue uploading folder contents. ${feedback.corruptedImageCount} corrupted files.`);
            onFeedbackUpdate(`⚠️ Warning: Issue uploading folder contents. ${feedback.corruptedImageCount} corrupted files.`);
            onAddLog(`⚠️ Warning: Issue uploading folder contents. ${feedback.corruptedImageCount} corrupted files.`);
        }
      setSelectedFolder(null);
      return;
    }
    
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadStatus('Please select files first.');
      return;
    }
    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
        const filesWithPaths = Array.from(selectedFiles) as (File & { path: string })[];
        const filePaths = filesWithPaths.map(file => file.path);    
        const feedback: Feedback = await window.api.uploadFiles(filePaths);
  
        if (feedback.success) {
            setUploadStatus(`✅ Success: Uploaded ${feedback.totalFileCount} file(s).`);
            onFeedbackUpdate(`✅ Success: Uploaded ${feedback.totalFileCount} files, Total Size: ${feedback.totalFileSize}, Corrupted: ${feedback.corruptedImageCount} file(s).`);
            onAddLog(`✅ Success: Uploaded ${feedback.totalFileCount} files, Total Size: ${feedback.totalFileSize}, Corrupted: ${feedback.corruptedImageCount} file(s).`);
        } else if (feedback.corruptedImageCount > 0) {
            setUploadStatus(`⚠️ Warning: ${feedback.corruptedImageCount} failed to upload.`);
            onFeedbackUpdate(`⚠️ Warning: ${feedback.corruptedImageCount} failed to upload.`);
            onAddLog(`⚠️ Warning: ${feedback.corruptedImageCount} failed to upload.`);
        }
        
        setIsUploading(false);
        setSelectedFiles(null); 

    } catch (error) {
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        setUploadStatus(`❌ Error during upload: ${errorMessage}`); 
        onFeedbackUpdate(`❌ Error during upload: ${errorMessage}`);
        onAddLog(`❌ Error during upload: ${errorMessage}`);
        setIsUploading(false);
    }
  };

  return (
    <div className="upload-panel card" style={{ padding: '2em', maxWidth: 400 }}>
      <h3>Upload Images</h3>
      <div
        className={`upload-dropzone${dragActive ? ' active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '2px solid #0078d4' : '2px dashed #888',
          padding: '2em',
          textAlign: 'center',
          marginBottom: '1em',
          background: dragActive ? '#f0f8ff' : '#fff',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <span style ={{color:'#000000ff'}}> Drag & drop files here or </span> <span style={{ color: '#0078d4', textDecoration: 'underline' }}>click to select</span>
        <input
          id="fileInput"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.tif,.tiff"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {selectedFiles && (
        <div style={{ marginBottom: '1em' }}>
          <strong>Selected files:</strong>
          <ul>
            {Array.from(selectedFiles).map((file, idx) => (
              <li key={idx}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={handleUpload}
        disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
        style={{
          padding: '0.5em 1.5em',
          background: '#0c0c0d',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: isUploading ? 'not-allowed' : 'pointer',
        }}
      >
        {isUploading ? 'Uploading...' : `Upload${selectedFiles ? ` (${selectedFiles.length})` : ''}`}
      </button>
      {uploadStatus && (
        <div style={{ marginTop: '1em', color: uploadStatus.includes('success') ? 'green' : 'white' }}>
          {uploadStatus}
        </div>
      )}
    </div>
  
  );
};

export default UploadPanel;