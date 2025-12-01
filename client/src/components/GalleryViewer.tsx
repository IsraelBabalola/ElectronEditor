import React, { useState, useEffect, useCallback } from 'react';
import './GalleryViewer.css'; 


interface GalleryViewerProps {
    onViewImage: (image: ImageMetadata) => void;
    onAddLog: (msg: string) => void;
}

const GalleryViewer: React.FC<GalleryViewerProps> = ({ onViewImage, onAddLog }) => {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async (imageType: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api.fetchImages(imageType); 
      setImages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchImagesBySize = useCallback(async (sizeFilter: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api.fetchImagesBySize(sizeFilter); 
      setImages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages("all");
  }, [fetchImages]);

  if (loading) return <div className="gallery-container">Loading images...</div>;
  if (error) return <div className="gallery-container" style={{ color: 'red' }}>Error: {error}</div>;

  const handleImageDoubleClick = (image: ImageMetadata) => {
    onViewImage(image);
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  const selectedType = event.target.value;
  fetchImages(selectedType);
};

  const handleSelectChangeSize = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSize = event.target.value;
    fetchImagesBySize(selectedSize);
  }

  const handleBatchDownload = async (imagesToDownload: ImageMetadata[]) => {
    try {
      const paths = imagesToDownload.map(img => img.filepath);      
      const resultMessage= await window.api.startBatchDownload(paths);
      onAddLog(`✅ ${resultMessage}`);

    } catch (error) {
      onAddLog(`❌ Error initiating batch download: ${error}`); 
      console.error("Error initiating batch download:", error);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try { 
      const result = await window.api.deleteImage(imageId);
      fetchImages("all");
      onAddLog(`✅ ${result}`);
    } catch (error) {
      onAddLog(`❌ Error deleting image with ID ${imageId}: ${error}`);
      console.error("Error deleting image:", error);
    }
  };

  return (
    <div className="gallery-container">
      <h2>Image Gallery ({images.length} items)</h2>
      <div className="dropdown-filters">
        <select onChange={handleSelectChange}>
          <option disabled selected>Filter by Type</option>
          <option value="all">All Types</option>
          <option value="png">PNG</option>
          <option value="tif">TIF</option>
          <option value="jpg">JPG</option>
        </select>
        <select onChange={handleSelectChangeSize}>
          <option disabled selected>Filter by Size:</option>
          <option value="G50">Biggest 50% In Size</option>
          <option value="smallest">Smallest 50% in Size</option>
        </select>
      </div>

      <div className="image-grid">
        {images.map((image) => (
          <div 
            key={image.id} 
            className="image-card" 
            title={image.filepath}
            onDoubleClick={() => handleImageDoubleClick(image)}
          >
            <button
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteImage(image.id);
              }}
            >
              🗑️
            </button>
            <img 
              src={`http://localhost:3001/storage//${image.filepath.split('/').pop()}`} 
              alt={image.filename} 
              className="image-thumbnail"
            />
          </div>
        ))}
      </div>
      <button onClick={() =>fetchImages("all")} style={{ marginTop: '20px' }}>Refresh Gallery</button>
      <button onClick={()=>handleBatchDownload(images)} style={{ marginLeft: '10px' }}>
          Batch Download Visible Images
        </button>
    </div>
  );
};

export default GalleryViewer;
