import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  code: string;
  language?: string;
  filePath?: string;
  line?: number;
  className?: string;
  title?: string;
}

export const CodeViewer: React.FC<Props> = ({
  code,
  language = 'python',
  filePath,
  line,
  className,
  title,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code snippet:', err);
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div
      className={cn('rounded-xl overflow-hidden text-sm', className)}
      style={{
        background: '#f7f7f6',
        border: '1px solid #e7e7e5',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.035)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 text-xs"
        style={{ background: 'rgba(255, 255, 255, 0.6)', borderBottom: '1px solid #e7e7e5' }}
      >
        <div className="flex items-center gap-2 font-mono" style={{ color: '#62625f' }}>
          <Terminal className="w-3.5 h-3.5" style={{ color: '#292928' }} />
          {filePath ? (
            <span>
              <span style={{ color: '#4f4f4c' }}>{filePath}</span>
              {line !== undefined && <span style={{ color: '#292928' }}>:{line}</span>}
            </span>
          ) : (
            <span>{title || `${language} snippet`}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #e2e2df',
            color: '#4f4f4c',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#20201f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#4f4f4c'; }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" style={{ color: '#17845f' }} />
              <span style={{ color: '#17845f' }}>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed">
        <pre style={{ color: '#252524' }}>
          <code>
            {lines.map((lineContent, idx) => (
              <div key={idx} className="table-row group">
                <span
                  className="table-cell pr-4 select-none text-right w-8"
                  style={{ color: '#d3d3d0' }}
                >
                  {line !== undefined ? line + idx : idx + 1}
                </span>
                <span className="table-cell whitespace-pre">
                  {highlightPython(lineContent)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};

function highlightPython(line: string): React.ReactNode {
  if (line.trim().startsWith('#')) {
    return <span style={{ color: '#70706d', fontStyle: 'italic' }}>{line}</span>;
  }

  const parts = line.split(/(".*?"|'.*?'|#.*$)/g);

  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return <span key={i} style={{ color: '#70706d', fontStyle: 'italic' }}>{part}</span>;
    }
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
      return <span key={i} style={{ color: '#17845f' }}>{part}</span>;
    }

    const words = part.split(/(\b(?:def|class|import|from|return|if|else|elif|try|except|finally|raise|logger|logging|async|await|with|as)\b)/g);
    return words.map((w, j) => {
      if (['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'try', 'except', 'finally', 'raise', 'async', 'await', 'with', 'as'].includes(w)) {
        return <span key={`${i}-${j}`} style={{ color: '#454543', fontWeight: 600 }}>{w}</span>;
      }
      if (['logger', 'logging'].includes(w)) {
        return <span key={`${i}-${j}`} style={{ color: '#646460', fontWeight: 500 }}>{w}</span>;
      }
      return w;
    });
  });
}
