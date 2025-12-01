import React, { useState, useEffect, useCallback } from 'react';

const FolderList: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api.fetchFolders(); 
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  if (loading) return <p>Loading folders...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div className="folder-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Your Projects</h3>
        <button onClick={fetchFolders} style={{ cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>
      <ul>
        {folders.map((folder) => (
          <li key={folder.id} className="folder-item">
            📁 {folder.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FolderList;
