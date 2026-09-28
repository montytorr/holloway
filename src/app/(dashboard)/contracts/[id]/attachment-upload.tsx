'use client';
import presentation from './attachment-upload-presentation.module.css';

import { useRef, useState, useTransition, type DragEvent } from 'react';
import { uploadContractAttachment } from './actions';
import { Upload } from 'lucide-react';

export default function ContractAttachmentUpload({
  contractId,
}: {
  contractId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncSelectedFile = (file?: File | null) => {
    setSelectedFileName(file?.name || null);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !fileInputRef.current) return;

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInputRef.current.files = dt.files;
    syncSelectedFile(file);
  };

  return (
    <form
      ref={formRef}
      className="col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          try {
            await uploadContractAttachment(contractId, form);
            formRef.current?.reset();
            if (fileInputRef.current) fileInputRef.current.value = '';
            syncSelectedFile(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
          }
        });
      }}
    >
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className="card card--inset"
        style={{
          padding: 14,
          cursor: 'pointer',
          border: dragActive
            ? '1px dashed var(--brand)'
            : '1px dashed var(--line-2)',
          background: dragActive ? 'var(--brand-bg)' : undefined,
          textAlign: 'center',
          display: 'block',
          transition: 'all 0.12s',
        }}
      >
        <input
          ref={fileInputRef}
          name="file"
          type="file"
          required
          onChange={(event) =>
            syncSelectedFile(event.target.files?.[0] || null)
          }
          className={presentation.field1}
        />
        <Upload size={18} className={presentation.ink1} />
        <div
          className={['text-xs', presentation.ink2].filter(Boolean).join(' ')}
        >
          {selectedFileName ? (
            <span className="pill pill--ghost text-2xs">
              {selectedFileName}
            </span>
          ) : (
            'Drop an artifact or click to browse'
          )}
        </div>
        <div
          className={['dim text-2xs', presentation.detail1]
            .filter(Boolean)
            .join(' ')}
        >
          Shared evidence, deliverables, and reference files for this contract.
        </div>
      </label>

      <div className="row gap-2">
        <input
          name="note"
          type="text"
          placeholder="Optional note"
          className={['cp-input', presentation.field2]
            .filter(Boolean)
            .join(' ')}
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn--primary btn--sm"
          style={{ opacity: pending ? 0.5 : 1 }}
        >
          {pending ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      <div className={['row', presentation.detail2].filter(Boolean).join(' ')}>
        {error ? (
          <span
            className={['text-2xs', presentation.ink3]
              .filter(Boolean)
              .join(' ')}
          >
            {error}
          </span>
        ) : (
          <span className="dim text-2xs">Private, signed downloads only.</span>
        )}
      </div>
    </form>
  );
}
