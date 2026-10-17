import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, X, AlertCircle, ArrowRight } from 'lucide-react';
import { cn, formatBytes } from '../lib/utils';

interface Props {
  onScan: (file: File) => void;
  isLoading: boolean;
  uploadProgress: number | null;
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const RepositoryUpload: React.FC<Props> = ({ onScan, isLoading, uploadProgress }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a valid .zip archive file.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File size (${formatBytes(file.size)}) exceeds the configured 20MB limit.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length > 0) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isLoading) return;
    onScan(selectedFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !isLoading && fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center p-8 md:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 text-center',
          !selectedFile && !isLoading && 'cursor-pointer'
        )}
        style={{
          borderColor: dragOver ? '#292928' : selectedFile ? '#70706d' : '#e2e2df',
          background: dragOver
            ? 'rgba(39, 39, 38, 0.08)'
            : selectedFile
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(255, 255, 255, 0.4)',
          transform: dragOver ? 'scale(1.005)' : 'scale(1)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <div
              className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl"
              style={{
                background: 'rgba(39, 39, 38, 0.12)',
                border: '1px solid rgba(39, 39, 38, 0.25)',
              }}
            >
              <UploadCloud className="w-8 h-8" style={{ color: '#292928' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#20201f' }}>
                Drag and drop your repository ZIP here
              </p>
              <p className="text-xs mt-1" style={{ color: '#62625f' }}>
                Or click to browse from your filesystem (max 20MB)
              </p>
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px]"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #e2e2df',
                color: '#62625f',
              }}
            >
              <span>Supported format: .zip containing Python code</span>
            </div>
          </div>
        ) : (
          <div
            className="w-full max-w-md p-4 rounded-xl text-left"
            style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1px solid #d3d3d0' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className="p-2.5 rounded-lg flex-shrink-0"
                  style={{
                    background: 'rgba(39, 39, 38, 0.12)',
                    border: '1px solid rgba(39, 39, 38, 0.25)',
                  }}
                >
                  <FileArchive className="w-6 h-6" style={{ color: '#454543' }} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold truncate" style={{ color: '#20201f' }}>
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: '#62625f' }}>
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              {!isLoading && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  className="p-1 rounded-md transition-colors cursor-pointer"
                  style={{ color: '#62625f' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#c51632'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#62625f'; }}
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {uploadProgress !== null && (
              <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid #e2e2df' }}>
                <div className="flex justify-between text-[11px] font-medium" style={{ color: '#4f4f4c' }}>
                  <span>Uploading archive</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: '#e7e7e5' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(90deg, #292928, #777773)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-xs"
          style={{
            background: 'rgba(197, 22, 50, 0.08)',
            border: '1px solid rgba(197, 22, 50, 0.25)',
            color: '#d72d45',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#c51632' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={!selectedFile || isLoading}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white transition-all',
            selectedFile && !isLoading ? 'btn-accent cursor-pointer' : 'cursor-not-allowed opacity-40'
          )}
          style={
            !selectedFile || isLoading
              ? { background: '#e2e2df', border: '1px solid #d3d3d0', color: '#62625f' }
              : {}
          }
        >
          {isLoading ? (
            <>
              <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
              <span>Scanning Repository…</span>
            </>
          ) : (
            <>
              <span>Scan Repository</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
