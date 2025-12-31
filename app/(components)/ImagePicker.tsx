"use client";

import { useRef, ChangeEvent } from "react";

interface ImagePickerProps {
  onImagesSelected: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * Multi-file image picker component
 * Accepts common image formats (JPEG, PNG, WebP, GIF)
 */
export function ImagePicker({ onImagesSelected, disabled = false }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImagesSelected(Array.from(files));
    }
    // Reset input so same files can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        aria-label="Select images"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Select images from your device"
      >
        Select Images
      </button>
      <p className="text-sm text-gray-500">
        Supports JPEG, PNG, WebP, GIF. Select multiple files.
      </p>
    </div>
  );
}
