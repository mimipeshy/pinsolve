
"use client";

import { IMAGES_MANIFEST } from "next/dist/shared/lib/constants";
// Import React hooks for managing state and side effects
import { useState, useEffect } from "react";

export default function Home() {

  // 1. STATE MANAGEMENT

  // Stores the actual uploaded image file
  const [image, setImage] = useState<File | null>(null);

  // Stores a temporary URL used to display the image preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Stores validation or other error messages
  const [error, setError] = useState<string | null>(null);

  // Stores the product name entered by the user
  const [productName, setProductName] = useState("");

  // Stores the intended target audience
  //trach if pinsolveai is processing a request
  const [targetAudience, setTargetAudience] = useState('');

  // Indicates whether the application is currently processing a request
  const [isLoading, setIsLoading] = useState(false);
  // Stores the marketing angles returned from the server
  type MarketingAngle = {
    angle_type: string;
    angle_name: string,
    target_audience: string;
    audience_motivation: string;
    marketing_message: string;
    pinterest_hook: string;
  };
  const [marketingAngles, setMarketingAngles] = useState<MarketingAngle[]>([]);
  // Stores the index of the selected marketing angle
  const [selectedAngle, setSelectedAngle] = useState<number | null>(null);
  // 2. IMAGE PREVIEW MANAGEMENT

  // Runs whenever the selected image changes
  useEffect(() => {

    // If no image exists, clear the preview
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    // Create a temporary URL for displaying the uploaded image
    const objectUrl = URL.createObjectURL(image);

    setPreviewUrl(objectUrl);

    // Release the temporary URL when it is no longer needed
    return () => {
      URL.revokeObjectURL(objectUrl);
    };

  }, [image]);


  // 3. GENERATE PINS FUNCTION

  async function generatePins() {

    // Clear any previous error message
    setError(null);

    // Ensure an image has been uploaded before proceeding
    if (!image) {
      setError("Please upload a product image before generating pins.");
      return;
    }
    // Indicate that the application is now processing the request
    setIsLoading(true);

    // Create FormData to package the image and product information
    const formData = new FormData();

    // Add the actual image file
    formData.append("image", image);

    // Add the optional product name
    formData.append("productName", productName);

    // Add the optional target audience
    formData.append("targetAudience", targetAudience);

    // TRY/CATCH HANDLES ERRORS DURING THE REQUEST
    try {

      // Send the image and product information to our backend API
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      // Check whether the server returned a successful HTTP status
      if (!response.ok) {
        throw new Error("Server request failed");
      }

      // Convert the server's JSON response into a JavaScript object
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Product analysis failed");
      }
      setMarketingAngles(result.marketingAngles);
      setSelectedAngle(null); // Reset selected angle when new angles are generated
      // Display the response in the browser console
      console.log("Product analysis result:", result.analysis);
      console.log("Marketing angles:", result.marketingAngles);

    } catch (error) {

      // Log the error for debugging
      console.error("Error sending data to server:", error);

      // Display a friendly error message in the interface
      setError("Something went wrong. Please try again.");
    }
    finally {
      // Regardless of success or failure, indicate that processing is complete
      setIsLoading(false);
    }
  }


  // 4. RENDER THE USER INTERFACE

  return (
    <main className="min-h-screeen bg-[#F7F8F3] text-gray-900 p-8 flex flex-col items-center">

      {/* header*/}
      <header className="bg-[#174d36] px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-3xl font-bold tracking-tight" >
            PinSolve AI
          </h1>
          <p className="mt-2 max-w-xl text-sm text-green-100">
            Turn product photos into Pinterest-worthy pins. Discover new audiences and create marketing angles
            that help your products stand out.
          </p>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#397653] text-center">
            Create Campaign
          </p>
          <h2 className="mt-2 text-2xl font-bold text-center">
            Let's get started with your product image
          </h2>
          <p className="mt-2 text-gray-600 text-center">
            Upload a product image and provide a product name and target audience. PinSolve AI will analyze the image and generate marketing angles to help you create compelling Pinterest pins.
          </p>
        </div>
        {/*UPLOAD CARD*/}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="textlg font-semibold">
            1. Upload your product image
          </h3>
          <p className="text-lg font-semibold">
            PNG or JPG only, under 5MB.
          </p>
          {/*image upload area*/}
          <div className="mt-5 rounded-xl border-2 border-dashed border-[#A8C6AF] bg-[#F7FAF6] p-8 text-center">
            <div className="text-4xl text-[#397653]">
              ↑
            </div>
            <p className="mt-3 font-medium">
              Drag your product image here
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Or Browse files from your computer
            </p>
            {previewUrl && (
              <div className="mt-5">
                <img
                  src={previewUrl}
                  alt="Uploaded product preview"
                  className="=mx-auto max-h-64 rounded-xl object-contain"
                /></div>
            )}
            <input
              className="mx-auto mt-5 block max-w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#74d36] file:px-4 file:py-2
              file:font-medium file:text-white hover:file:bg-[#236345]"
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                if (
                  !["image/png", "image/jpeg"].includes(file.type) ||
                  file.size === 0 ||
                  file.size > 5 * 1024 * 1024
                ) {
                  setError(
                    "Please upload a valid PNG or JPG image under 5MB"
                  );
                  setImage(null);
                  return;
                }
                setError(null);
                setMarketingAngles([]);
                setSelectedAngle(null);
                setImage(file);

              }}
            />
          </div>
          {/*error message*/}
          {error &&(
            <p className="mt-4 rounded-lg- bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}
          {/*product details*/}
          <div className="mt-8">
            <h3 className="text-lg font-semibold">
              2. Tell us about your product
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Additional information helps us create more rlevant marketing angles.
            </p>
            <label className ="mt-5 block text-sm font-medium">
              Product Name
              <span className="ml-1 font-normal text-gray-400">
                (Optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ninja Air Fryer"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none transition focus:border-[#397653] focus:ring-2 focus:ring-green-100"
              value={productName}
              onChange={(e)=>setProductName(e.target.value)}
              />
              <label className="mt-5 block text-sm font-medium">
                Target Audience
                <span className="ml-1 font-normal text-gray-400">
                  (Optional)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. Busy parents and Families"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none
                transition focus:border-[#397653] focus:ring-2 focus:ring-green-100"
                value={targetAudience}
                onChange={(e)=> setTargetAudience(e.target.value)}
                />
          </div>
          {/*generate button*/}
          <button
            type="button"
            disabled ={!image || isLoading}
            className="mt-8 w-full roundedd-xl bg-[#174d36] px-6 py-4 font-semibold
            text-white transition hover:bg-[#236345] disbled:cursor-not-allowed disabled:opacity-50"
            onClick={generatePins}>
              {isLoading ? "Analysing your product......"
              :"Analyze Product & Generate Angles"}
            </button>
            <p className="mt-3 text-center text-xs text-gray-400">
              Three distinct marketing approached for every product.
            </p>
        </div>
      </section>
    </main>
  );
}

