/**
 * ShareDialog - Share project via URL
 *
 * Features:
 * - Generate shareable URL with encoded project data
 * - Expiration time (default 7 days)
 * - Read-only mode
 * - QR code generation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ProjectInput } from '../domain/schemas';

// Share data structure
export interface ShareData {
  id: string;
  input: ProjectInput;
  name: string;
  description?: string;
  createdAt: string;
  expiresAt: string;
  version: string;
}

// Share options
export interface ShareOptions {
  expiresIn?: number; // Days
  password?: string;
  allowCopy?: boolean;
  maxViews?: number;
}

// Generated share result
export interface ShareResult {
  url: string;
  shortUrl?: string;
  qrCode?: string;
  expiresAt: string;
}

const SHARE_VERSION = 'v1';
const BASE_URL = window.location.origin;
const DEFAULT_EXPIRY_DAYS = 7;

export class ShareService {
  /**
   * Generate shareable URL
   */
  generateShareUrl(
    projectId: string,
    input: ProjectInput,
    name: string,
    description?: string,
    options?: ShareOptions
  ): ShareResult {
    const shareData: ShareData = {
      id: projectId,
      input,
      name,
      description,
      createdAt: new Date().toISOString(),
      expiresAt: this.calculateExpiry(options?.expiresIn || DEFAULT_EXPIRY_DAYS),
      version: SHARE_VERSION,
    };

    // Encode share data to base64
    const encoded = this.encodeShareData(shareData);
    const url = `${BASE_URL}/shared/${encoded}`;

    return {
      url,
      expiresAt: shareData.expiresAt,
    };
  }

  /**
   * Parse shared URL
   */
  parseSharedUrl(encoded: string): ShareData | null {
    try {
      const shareData = this.decodeShareData(encoded);

      // Validate expiration
      if (new Date(shareData.expiresAt) < new Date()) {
        throw new Error('Share link has expired');
      }

      // Validate version
      if (shareData.version !== SHARE_VERSION) {
        throw new Error('Unsupported share version');
      }

      return shareData;
    } catch (error) {
      console.error('Error parsing shared URL:', error);
      return null;
    }
  }

  /**
   * Encode share data to base64
   */
  private encodeShareData(data: ShareData): string {
    const json = JSON.stringify(data);
    const compressed = this.compress(json);
    return btoa(compressed);
  }

  /**
   * Decode share data from base64
   */
  private decodeShareData(encoded: string): ShareData {
    const compressed = atob(encoded);
    const json = this.decompress(compressed);
    return JSON.parse(json);
  }

  /**
   * Simple compression (remove unnecessary whitespace)
   */
  private compress(str: string): string {
    return str.replace(/\s+/g, ' ').trim();
  }

  /**
   * Decompress (no-op for simple compression)
   */
  private decompress(str: string): string {
    return str;
  }

  /**
   * Calculate expiration date
   */
  private calculateExpiry(days: number): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry.toISOString();
  }

  /**
   * Check if share is expired
   */
  isExpired(shareData: ShareData): boolean {
    return new Date(shareData.expiresAt) < new Date();
  }

  /**
   * Get days remaining until expiration
   */
  getDaysRemaining(shareData: ShareData): number {
    const now = new Date();
    const expiry = new Date(shareData.expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }
}

// React Component for Share Dialog
interface ShareDialogProps {
  projectId: string;
  input: ProjectInput;
  name: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  projectId,
  input,
  name,
  description,
  isOpen,
  onClose,
}) => {
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [expiryDays, setExpiryDays] = useState(DEFAULT_EXPIRY_DAYS);

  const shareService = useMemo(() => new ShareService(), []);

  // Generate share URL when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      const result = shareService.generateShareUrl(projectId, input, name, description, {
        expiresIn: expiryDays,
      });
      setShareResult(result);
      setCopySuccess(false);
    }
  }, [isOpen, projectId, input, name, description, expiryDays, shareService]);

  const handleCopyUrl = useCallback(async () => {
    if (!shareResult) return;

    try {
      await navigator.clipboard.writeText(shareResult.url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, [shareResult]);

  const handleRegenerate = useCallback(() => {
    if (!shareResult) return;
    const result = shareService.generateShareUrl(projectId, input, name, description, {
      expiresIn: expiryDays,
    });
    setShareResult(result);
  }, [projectId, input, name, description, expiryDays, shareService]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Share Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Project Info */}
          <div>
            <h3 className="font-medium text-gray-900">{name}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>

          {/* Expiration Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link expires in
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {/* Share URL */}
          {shareResult && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shareable Link
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={shareResult.url}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={handleCopyUrl}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    copySuccess
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Regenerate button */}
              <button
                onClick={handleRegenerate}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Generate new link
              </button>

              {/* Expiry info */}
              <p className="mt-2 text-sm text-gray-600">
                Expires: {new Date(shareResult.expiresAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex">
              <svg
                className="w-5 h-5 text-yellow-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-yellow-800">
                Anyone with this link can view the project in read-only mode.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
