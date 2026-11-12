"use client";
import { useState, useEffect } from "react";


export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const[targetAudience, setTargetAudience] = useState('')

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">PinSolve AI</h1>
      <p className="mt-3 text-gray-600">Turn product photos into Pinterest-worthy pins.</p>
      <h2 className="text-xl font-semibold mt-10">Upload your product image</h2>
      <p>Choose a PNG or JPG file to get started</p>
      <div className="mt-4 w-full max-w-xl rounded-2xl border border-dashed p-8 text-center">
        <p className="text-lg font-medium"> Drag your Product Image Here</p>
        <p className="mt-2 text-sm text-gray-500">or browse files</p>
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Uploaded Image"
            className="mx-auto max-h-64 rounded-lg"
          />
        )}
        <input
          className="mt-6"
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (!file) return;
            e.target.value = '';

            if (
              !['image/png', 'image/jpeg'].includes(file.type) ||
              file.size > 5 * 1024 * 1024
            ) {
              setError('Invalid file type or size. Please upload a PNG or JPG image under 5MB.');
              setImage(null);
              return;
            }
            setError(null);
            setImage(file);
          }}
        />
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
        <label className="block text-left text-sm font-medium">
          Product name
        </label>
        <input type="text"
          placeholder="Enter Product Name"
          className="mt-2 w-full rounded-lg border p-3"
          value={productName || ''}
          onChange={(e) => {
            setProductName(e.target.value)
          }}
        />
        <label className="block text-left text-sm font-medium mt-4">
          Target Audience
        </label>  
        <input type="text"
          placeholder="Moms with kids running daily errands"
          className="mt-2 w-full rounded-lg border p-3"
          value={targetAudience || ''}
          onChange={(e) => {
            setTargetAudience(e.target.value)
          }}
        />
        <button
          type="button"
          disabled={!image}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white disabled:opacity-50">
            Generate Pins
          </button>
          </div>
    </main>
  );
}