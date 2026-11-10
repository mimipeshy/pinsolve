"use client";
import {useState, useEffect} from "react";


export default function Home() {
  const[image,setImage] = useState<File | null>(null);
  const[previewUrl,setPreviewUrl] = useState<string | null>(null);
  useEffect(()=>{
    if(!image){
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);
    return()=>{
      URL.revokeObjectURL(objectUrl);
    };
  },[image]);


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
          if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
          } 
        }}
      
      />
      </div>
    </main>
  );
}