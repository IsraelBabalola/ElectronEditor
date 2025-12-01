import React, { useState } from 'react';
import './App.css';
import GalleryViewer from './components/GalleryViewer'; 
import UploadPanel from './components/UploadPanel';
import Logs from './components/Logs';
import SingleImageViewer from './components/SingleImageViewer';

function App() {
  const [currentView, setCurrentView] = useState<'gallery' | 'viewer'>('gallery');
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleViewImage = (image: ImageMetadata) => {
    setSelectedImage(image);
    setCurrentView('viewer');
  };

  const handleFeedbackUpdate = (newFeedback: string) => {

  };

  const handleBackToGallery = () => {
    setSelectedImage(null);
    setCurrentView('gallery');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Electron Image Editor</h1>
      </header>
      

      <div className="main-content-area">
        <aside className="panel sidebar">
          <h2>File Management</h2>
          <UploadPanel onFeedbackUpdate={handleFeedbackUpdate} onAddLog={addLog}/>
          
        </aside>
        
        <main className="panel content">
          {currentView === 'gallery' && (
            <GalleryViewer onViewImage={handleViewImage} onAddLog={addLog} />
          )}
          {currentView === 'viewer' && selectedImage && (
            <SingleImageViewer image={selectedImage} onBack={handleBackToGallery} onAddLog={addLog}/>
          )}
          
        </main>
        <div className="log-panel">
            <h2>Activity Logs</h2>
            <div id="log-output">
              <Logs feedbackMessages={logs} />
            </div>
        </div>
        
      </div>

      <footer className="footer">
        <span>Status: Ready | Connected to API v1.0</span>
      </footer>
      
    </div>
    
  );
}

export default App;
