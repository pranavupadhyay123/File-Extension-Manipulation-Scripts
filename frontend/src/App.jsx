import React, { useState, useEffect } from 'react';
import { 
  FileImage, 
  FileType, 
  Database, 
  ArrowLeft, 
  Upload, 
  Download, 
  Scissors, 
  Zap, 
  Image as ImageIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Tool Components ---

const ToolCard = ({ icon: Icon, title, description, onClick, color }) => (
  <motion.div 
    className="glass-card tool-card"
    onClick={onClick}
    whileHover={{ y: -8 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="tool-icon" style={{ backgroundColor: `${color}15`, color: color }}>
      <Icon size={28} />
    </div>
    <h3 className="tool-title">{title}</h3>
    <p className="tool-description">{description}</p>
  </motion.div>
);

const FileDropZone = ({ onFileSelect, accept, multiple = false }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(multiple ? e.dataTransfer.files : e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`drop-zone ${isDragActive ? 'active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput').click()}
    >
      <Upload size={48} className="mx-auto mb-4" stroke={isDragActive ? '#3b82f6' : '#94a3b8'} />
      <p className="text-lg font-medium">Click or Drag files here to upload</p>
      <p className="subtitle mt-2">Supports {accept}</p>
      <input 
        id="fileInput" 
        type="file" 
        className="hidden" 
        accept={accept} 
        onChange={(e) => onFileSelect(multiple ? e.target.files : e.target.files[0])}
        multiple={multiple}
      />
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const tools = [
    { 
      id: 'compress', 
      title: 'Image Compressor', 
      description: 'Optimize JPG, PNG, and JPEG files with custom quality control.', 
      icon: Zap, 
      color: '#3b82f6' 
    },
    { 
      id: 'crop', 
      title: 'Smart Auto-Crop', 
      description: 'Automatically remove empty space and borders from images.', 
      icon: Scissors, 
      color: '#10b981' 
    },
    { 
      id: 'pdf-maker', 
      title: 'Images to PDF', 
      description: 'Convert and combine multiple images into a single professional PDF.', 
      icon: FileType, 
      color: '#6366f1' 
    },
    { 
      id: 'pdf-to-jpg', 
      title: 'PDF to Image', 
      description: 'Extract pages from PDF documents and save them as high-quality JPGs.', 
      icon: FileImage, 
      color: '#f59e0b' 
    },
    { 
      id: 'db-editor', 
      title: 'SQLite Editor', 
      description: 'View, edit, and export SQLite database files directly in your browser.', 
      icon: Database, 
      color: '#ec4899' 
    }
  ];

  const handleToolAction = async (formData, endpoint, downloadName) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Action failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName || 'processed_file';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setResult('success');
    } catch (err) {
      console.error(err);
      alert('Failed to process file. Make sure the backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderToolView = () => {
    switch (activeTool) {
      case 'compress':
        return (
          <div className="tool-view">
            <h2 className="tool-title mb-6 flex items-center gap-3">
              <Zap style={{ color: '#3b82f6' }} /> Image Compressor
            </h2>
            <div className="max-w-2xl mx-auto">
              <FileDropZone 
                accept=".jpg, .jpeg, .png" 
                onFileSelect={(file) => {
                  const quality = document.getElementById('qualityRange').value;
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('quality', quality);
                  handleToolAction(formData, 'compress', `compressed_${file.name}`);
                }} 
              />
              <div className="mt-8 glass-card p-6">
                <label className="input-label">Compression Quality: <span id="qualityVal">70</span>%</label>
                <input 
                  type="range" 
                  id="qualityRange" 
                  min="1" max="100" defaultValue="70" 
                  onChange={(e) => document.getElementById('qualityVal').textContent = e.target.value}
                />
                <p className="subtitle text-sm">Higher quality results in larger file sizes.</p>
              </div>
            </div>
          </div>
        );
      case 'crop':
        return (
          <div className="tool-view">
            <h2 className="tool-title mb-6 flex items-center gap-3">
              <Scissors style={{ color: '#10b981' }} /> Smart Auto-Crop
            </h2>
            <div className="max-w-2xl mx-auto text-center">
              <FileDropZone 
                accept="image/*" 
                onFileSelect={(file) => {
                  const formData = new FormData();
                  formData.append('file', file);
                  handleToolAction(formData, 'crop', `cropped_${file.name}`);
                }} 
              />
              <p className="mt-6 subtitle">Our AI will automatically detect and trim the whitespace from your image.</p>
            </div>
          </div>
        );
      case 'pdf-maker':
        return (
          <div className="tool-view">
            <h2 className="tool-title mb-6 flex items-center gap-3">
              <FileType style={{ color: '#6366f1' }} /> Images to PDF
            </h2>
            <div className="max-w-2xl mx-auto text-center">
              <FileDropZone 
                accept="image/*" 
                multiple={true}
                onFileSelect={(files) => {
                  const formData = new FormData();
                  Array.from(files).forEach(f => formData.append('files', f));
                  handleToolAction(formData, 'pdf-maker', 'converted_images.pdf');
                }} 
              />
              <p className="mt-6 subtitle">Upload multiple images to merge them into a single PDF document.</p>
            </div>
          </div>
        );
      case 'pdf-to-jpg':
        return (
          <div className="tool-view">
            <h2 className="tool-title mb-6 flex items-center gap-3">
              <FileImage style={{ color: '#f59e0b' }} /> PDF to Image
            </h2>
            <div className="max-w-2xl mx-auto text-center">
              <FileDropZone 
                accept=".pdf" 
                onFileSelect={(file) => {
                  const formData = new FormData();
                  formData.append('file', file);
                  handleToolAction(formData, 'pdf-to-jpg', 'converted_pages.zip');
                }} 
              />
              <p className="mt-6 subtitle">Convert every page of your PDF into high-quality JPEG images automatically.</p>
            </div>
          </div>
        );
      case 'db-editor':
        return <DbEditor onBack={() => setActiveTool(null)} />;
      default:
        return (
          <div className="bento-grid">
            {tools.map((tool) => (
              <ToolCard key={tool.id} {...tool} onClick={() => setActiveTool(tool.id)} />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1 className="logo">FileFlow</h1>
        <p className="subtitle">Premium productivity tools for seamless file manipulation.</p>
      </header>

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool || 'dashboard'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTool && (
              <button className="btn-back" onClick={() => setActiveTool(null)}>
                <ArrowLeft size={18} /> Back to Dashboard
              </button>
            )}
            {renderToolView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {isProcessing && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Zap size={48} className="text-blue-500 mx-auto mb-4" />
            </motion.div>
            <p className="text-xl font-semibold">Processing your file...</p>
            <p className="text-slate-500">This will only take a moment.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SQLite Editor Component ---

function DbEditor() {
  const [db, setDb] = useState(null);
  const [tables, setTables] = useState([]);
  const [currentTable, setCurrentTable] = useState('');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [SQL, setSQL] = useState(null);

  useEffect(() => {
    // Dynamically load sql.js from CDN to avoid huge bundle issues in this demo environment
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js";
    script.async = true;
    script.onload = () => {
      window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
      }).then(sql => setSQL(sql));
    };
    document.body.appendChild(script);
  }, []);

  const handleFile = (file) => {
    if (!SQL) return;
    const reader = new FileReader();
    reader.onload = function() {
      const uInt8Array = new Uint8Array(reader.result);
      const newDb = new SQL.Database(uInt8Array);
      setDb(newDb);
      
      const res = newDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      const tableNames = res[0] ? res[0].values.map(v => v[0]) : [];
      setTables(tableNames);
      if (tableNames.length > 0) loadTable(tableNames[0], newDb);
    };
    reader.readAsArrayBuffer(file);
  };

  const loadTable = (tableName, targetDb = db) => {
    setCurrentTable(tableName);
    const res = targetDb.exec(`SELECT * FROM ${tableName} LIMIT 100`);
    if (res[0]) {
      setColumns(res[0].columns);
      setData(res[0].values);
    }
  };

  const exportCsv = () => {
    let csv = columns.join(',') + '\n';
    data.forEach(row => {
      csv += row.map(v => `"${v}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTable}.csv`;
    a.click();
  };

  return (
    <div className="tool-view">
      <h2 className="tool-title mb-6 flex items-center gap-3">
        <Database style={{ color: '#ec4899' }} /> SQLite Editor
      </h2>
      
      {!db ? (
        <FileDropZone accept=".db, .sqlite" onFileSelect={handleFile} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center justify-between glass-card p-4">
            <select 
              className="p-2 border rounded-lg bg-white"
              value={currentTable}
              onChange={(e) => loadTable(e.target.value)}
            >
              {tables.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={exportCsv}>Export to CSV</button>
              <button 
                className="btn-primary" 
                style={{ backgroundColor: '#64748b' }}
                onClick={() => setDb(null)}
              >
                Upload New DB
              </button>
            </div>
          </div>

          <div className="glass-card table-container">
            <table>
              <thead>
                <tr>
                  {columns.map(c => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => <td key={j}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
