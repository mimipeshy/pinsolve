
"use client";

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
  const [targetAudience, setTargetAudience] = useState("");


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

    // Release the previous temporary URL when it is no longer needed
    return () => {
      URL.revokeObjectURL(objectUrl);
    };

  }, [image]);


  // 3. GENERATE PINS FUNCTION

  function generatePins() {

    // Clear any previous error message
    setError(null);

    // Ensure an image has been uploaded before proceeding
    if (!image) {
      setError("Please upload a product image before generating pins.");
      return;
    }

    // Create FormData to package the image and product information
    const formData = new FormData();

    // Add the actual image file
    formData.append("image", image);

    // Add the optional product name
    formData.append("productName", productName);

    // Add the optional target audience
    formData.append("targetAudience", targetAudience);

    // Log the submitted information for frontend testing
    console.log("Generating pins for:", {
      image,
      productName,
      targetAudience
    });

    // Next step: Send formData to our Next.js API using fetch()
  }


  // 4. RENDER THE USER INTERFACE

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">

      {/* Application heading */}
      <h1 className="text-4xl font-bold">
        PinSolve AI
      </h1>

      <p className="mt-3 text-gray-600">
        Turn product photos into Pinterest-worthy pins.
      </p>

      <h2 className="mt-10 text-xl font-semibold">
        Upload your product image
      </h2>

      <p>
        Choose a PNG or JPG file to get started.
      </p>

      {/* Image upload container */}
      <div className="mt-4 w-full max-w-xl rounded-2xl border border-dashed p-8 text-center">

        <p className="text-lg font-medium">
          Drag your product image here
        </p>

        <p className="mt-2 text-sm text-gray-500">
          or browse files
        </p>

        {/* Display image preview when available */}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Uploaded product preview"
            className="mx-auto max-h-64 rounded-lg"
          />
        )}

        {/* Image upload input */}
        <input
          className="mt-6"
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => {

            // Retrieve the selected file
            const file = e.target.files?.[0];

            // Stop if no file was selected
            if (!file) return;

            // Reset input so the same file can be selected again
            e.target.value = "";

            // Validate file type and size
            if (
              !["image/png", "image/jpeg"].includes(file.type) ||
              file.size > 5 * 1024 * 1024
            ) {
              setError(
                "Invalid file type or size. Please upload a PNG or JPG image under 5MB."
              );

              // Clear the previously selected image
              setImage(null);
              return;
            }

            // Clear previous errors and save the valid image
            setError(null);
            setImage(file);

          }}
        />

        {/* Display validation errors when they exist */}
        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Product name field */}
        <label className="mt-4 block text-left text-sm font-medium">
          Product name
        </label>

        <input
          type="text"
          placeholder="Enter product name"
          className="mt-2 w-full rounded-lg border p-3"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />

        {/* Target audience field */}
        <label className="mt-4 block text-left text-sm font-medium">
          Target audience
        </label>

        <input
          type="text"
          placeholder="Moms with kids running daily errands"
          className="mt-2 w-full rounded-lg border p-3"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
        />

        {/* Generate Pins button */}
        <button
          type="button"
          disabled={!image}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white disabled:opacity-50"
          onClick={generatePins}
        >
          Generate Pins
        </button>

      </div>
    </main>
  );
}
