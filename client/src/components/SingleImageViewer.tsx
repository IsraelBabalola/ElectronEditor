import React, { useState, useRef, useCallback } from 'react';

interface SingleImageViewerProps {
  image: any;
  onBack: () => void;
  onAddLog: (msg: string) => void;
}

declare global {
    interface Window {
        api: any;
    }
}

const SingleImageViewer: React.FC<SingleImageViewerProps> = ({ image, onBack, onAddLog }) => {
  const [zoom, setZoom] = useState(100); 
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [startSelection, setStartSelection] = useState<{ x: number; y: number } | null>(null);
  const [cropping, setCropping] = useState(false);
  const [cropStatus, setCropStatus] = useState<string>('');

  const viewerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 3000));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 5, 10));

  const scrollLeft = viewerRef.current?.scrollLeft || 0;
  const scrollTop = viewerRef.current?.scrollTop || 0;

  const storedName = image.filepath.split('/').pop();
  const imageUrl = `http://localhost:3001/storage/${encodeURIComponent(storedName!)}`;

  const fitImageToViewer = useCallback(() => {
    if (!viewerRef.current || !imgRef.current) return;

    const viewerWidth = viewerRef.current.clientWidth;
    const viewerHeight = viewerRef.current.clientHeight;
    const imgWidth = imgRef.current.naturalWidth;
    const imgHeight = imgRef.current.naturalHeight;

    if (imgWidth === 0 || imgHeight === 0) return;

    const widthRatio = viewerWidth / imgWidth;
    const heightRatio = viewerHeight / imgHeight;
    const bestFitRatio = Math.min(widthRatio, heightRatio);
    const newZoom = Math.floor(bestFitRatio * 100 * 0.95);
    setZoom(newZoom);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewerRef.current) return;
    const rect = viewerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (e.shiftKey) {
      setStartSelection({ x, y });
      setSelection({ x, y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewerRef.current) return;
    if (startSelection) {
      const rect = viewerRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelection({
        x: startSelection.x,
        y: startSelection.y,
        w: x - startSelection.x,
        h: y - startSelection.y,
      });
    }
  };

  const handleMouseUp = () => {
    setStartSelection(null);
  };

  const handleMouseLeave = () => {
    setStartSelection(null);
  };

  const handleCropAndSave = async () => {
    if (!selection || !imgRef.current || !viewerRef.current) return;
    setCropping(true);
    setCropStatus('Processing...');
    try {
      const img = imgRef.current;
      const imgRect = img.getBoundingClientRect();
      const viewerRect = viewerRef.current.getBoundingClientRect();

      const naturalWidth = img.naturalWidth;;
      const naturalHeight = img.naturalHeight;

      const selectionXAbsolute = selection.x + scrollLeft;
      const selectionYAbsolute = selection.y + scrollTop;
      const imageOffsetX = imgRect.left - viewerRect.left + scrollLeft;;
      const imageOffsetY = imgRect.top - viewerRect.top + scrollTop;

      const scaleX = naturalWidth / (imgRect.width);
      const scaleY = naturalHeight / (imgRect.height);
      
      const sx = Math.round((selectionXAbsolute - imageOffsetX) * scaleX);
      const sy = Math.round((selectionYAbsolute - imageOffsetY) * scaleY);
      const sw = Math.round(selection.w * scaleX);
      const sh = Math.round(selection.h * scaleY);

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject('Failed to crop'), 'image/png');
      });
      const file = new File([blob], `cropped_${Date.now()}.png`, { type: 'image/png' });
      const arrayBuffer = await file.arrayBuffer();
      const apiUploadUrl = 'http://localhost:3001/images/upload';
      const uploadResult = await window.api.uploadCroppedImage(
        apiUploadUrl, 
        arrayBuffer, 
        `cropped_${Date.now()}.png`
      );
      console.log("Upload successful! Server response:", uploadResult);
      onAddLog(`✅ Cropped image uploaded successfully: ${file.name}`);
      setCropStatus('Cropped image uploaded successfully!');
      setSelection(null);
    } catch (err: any) {
      setCropStatus('Error: ' + (err?.message || err));
      onAddLog(`❌ Error uploading cropped image: ${err?.message || err}`);
    } finally {
      setCropping(false);
    }
  };

  return (
    <div className="single-image-viewer" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button onClick={onBack}>&larr; Back to Gallery</button>
        <div>
          <button onClick={handleZoomOut}>- Zoom</button>
          <span style={{ margin: '0 1em' }}>{zoom}%</span> 
          <button onClick={handleZoomIn}>+ Zoom</button>
        </div>
      </div>
      <h3>{image.filename}</h3>
      <div
        ref={viewerRef}
        className="viewer-area"
        style={{
          border: '1px solid #444',
          overflow: 'auto',
          height: '60vh',
          width: '100%',
          position: 'relative',
          backgroundColor: '#111',
          cursor: selection ? 'crosshair' : 'default',
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img
          crossOrigin="anonymous"
          ref={imgRef}
          src={imageUrl}
          alt={image.filename}
          onLoad={fitImageToViewer}
          style={{
            transform: `scale(${zoom / 100})`,
            maxWidth: 'none',
            pointerEvents: 'none',
            display: 'block',
            transformOrigin: 'center center',
          }}
          draggable={false}
        />
        {selection && (
          <div
            style={{
              position: 'absolute',
              left: selection.x + scrollLeft,
              top: selection.y + scrollTop,
              width: selection.w,
              height: selection.h,
              border: '2px dashed #0ff',
              background: 'rgba(0,255,255,0.1)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      {selection && (
        <div style={{ marginTop: '1em', color: '#0ff' }}>
          Selected area: x={selection.x}, y={selection.y}, w={selection.w}, h={selection.h}
          <br />
          <button onClick={handleCropAndSave} disabled={cropping} style={{ marginTop: '10px' }}>
            {cropping ? 'Processing...' : 'Crop & Save Selection'}
          </button>
          {cropStatus && <p>{cropStatus}</p>}
        </div>
      )}
    </div>
  );
};

export default SingleImageViewer;
