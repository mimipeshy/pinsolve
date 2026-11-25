
"use client";

import { useEffect, useState } from "react";

type MarketingAngle = {
  angle_type: string;
  angle_name: string;
  target_audience: string;
  audience_motivation: string;
  marketing_message: string;
  pinterest_hook: string;
};

type PinterestContent = {
  pin_title: string;
  pin_description: string;
  keywords: string[];
  cta: string;
  pin_hook: string;
};

type KeywordCandidate = {
  keyword: string;
  category:
  | "product"
  | "aesthetic"
  | "lifestyle"
  | "problem_solution"
  | "long_tail";
  reason: string;
  recommended: boolean;
};

export default function Home() {
  // Product upload and details
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [productDescription, setProductDescription] = useState("");

  // Product analysis and approval
  const [productAnalysis, setProductAnalysis] = useState("");
  const [isAnalysisApproved, setIsAnalysisApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Marketing angle generation and selection
  const [marketingAngles, setMarketingAngles] = useState<MarketingAngle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<number | null>(null);
  const [chosenAngle, setChosenAngle] = useState<MarketingAngle | null>(null);

  const [isGeneratingAngles, setIsGeneratingAngles] = useState(false);
  const [angleError, setAngleError] = useState<string | null>(null);

  // Keyword generation and selection
  const [keywordCandidates, setKeywordCandidates] = useState<KeywordCandidate[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [keywordError, setKeywordError] = useState<string | null>(null);

  // Pinterest content state - used in the next stage
  const [pinterestContent, setPinterestContent] =
    useState<PinterestContent | null>(null);

  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Create and clean up the uploaded image preview URL
  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  // Request product analysis from the backend
  async function analyzeProduct() {
    setError(null);

    if (!image) {
      setError("Please upload a product image before continuing.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("productName", productName);
    formData.append("productDescription", productDescription);
    formData.append("targetAudience", targetAudience);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Product analysis failed.");
      }

      setProductAnalysis(result.analysis);
      setIsAnalysisApproved(false);

      setMarketingAngles([]);
      setSelectedAngle(null);
      setChosenAngle(null);

      setKeywordCandidates([]);
      setSelectedKeywords([]);
      setKeywordError(null);

      setPinterestContent(null);
      setContentError(null);
    } catch (err) {
      console.error("Product analysis error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Generate three marketing angles from the approved product analysis
  async function generateAngles() {
    if (!isAnalysisApproved || !productAnalysis.trim()) return;

    setIsGeneratingAngles(true);
    setAngleError(null);

    // Reset downstream stages
    setSelectedAngle(null);
    setChosenAngle(null);

    setKeywordCandidates([]);
    setSelectedKeywords([]);
    setKeywordError(null);

    setPinterestContent(null);
    setContentError(null);

    try {
      const response = await fetch("/api/angles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          productAnalysis,
          targetAudience,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to generate marketing angles.");
      }

      if (!Array.isArray(result.marketingAngles)) {
        throw new Error(
          "The server returned an unexpected marketing angles response."
        );
      }

      setMarketingAngles(result.marketingAngles);
      setSelectedAngle(null);
      setChosenAngle(null);
      setPinterestContent(null);
    } catch (err) {
      console.error("Angle generation error:", err);

      setAngleError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating marketing angles."
      );
    } finally {
      setIsGeneratingAngles(false);
    }
  }

  // Generate keyword suggestions based on the selected marketing angle
  async function continueWithAngle() {
    if (selectedAngle === null || !marketingAngles[selectedAngle]) return;

    const angle = marketingAngles[selectedAngle];

    setChosenAngle(angle);

    setKeywordCandidates([]);
    setSelectedKeywords([]);
    setKeywordError(null);

    setPinterestContent(null);
    setContentError(null);

    setIsGeneratingKeywords(true);

    try {
      console.log("Sending request to /api/keywords...");

      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          productAnalysis,
          targetAudience,
          chosenAngle: angle,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to generate keyword suggestions."
        );
      }

      if (!Array.isArray(result.keywords)) {
        throw new Error("The server returned an unexpected keyword response.");
      }

      const keywords = result.keywords as KeywordCandidate[];

      setKeywordCandidates(keywords);

      // Automatically select recommended keywords
      const recommendedKeywords = keywords
        .filter((keyword) => keyword.recommended)
        .map((keyword) => keyword.keyword);

      setSelectedKeywords(recommendedKeywords);

      console.log("Keyword suggestions:", keywords);
      console.log("Recommended keywords:", recommendedKeywords);
    } catch (err) {
      console.error("Keyword generation error:", err);

      setKeywordError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating keywords."
      );
    } finally {
      setIsGeneratingKeywords(false);
    }
  }

  // Toggle an individual keyword
  function toggleKeyword(keyword: string) {
    setSelectedKeywords((currentKeywords) =>
      currentKeywords.includes(keyword)
        ? currentKeywords.filter((item) => item !== keyword)
        : [...currentKeywords, keyword]
    );
  }

  // Restore the AI recommended keywords
  function useRecommendedKeywords() {
  const recommendedKeywords = keywordCandidates
    .filter((keyword) => keyword.recommended)
    .map((keyword) => keyword.keyword);

  setSelectedKeywords(recommendedKeywords);
}
  //generate pinterest content using the approved stargetgy and keywords
  async function generatePinterestContent() {
    if (!chosenAngle || selectedKeywords.length === 0) {
      setContentError(
        "Please select a marketing angle and atleast one keyword."
      );
      return;
    }
    setIsGeneratingContent(true);
    setContentError(null);
    setPinterestContent(null);
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          productAnalysis,
          targetAudience,
          chosenAngle,
          selectedKeywords,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to generate Pinterest content."
        );
      }
      if (!result.pinterestContent) {
        throw new Error(
          "The server returned an unexpected Pinterest content response."
        );
      }
      setPinterestContent(result.pinterestContent);
      console.log("Generated pinterest content:", result.pinterestContent);
    } catch (err) {
      console.error("Pinterest content generation error:", err);
      setContentError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating Pinterest content."
      );
    } finally {
      setIsGeneratingContent(false);
    }
  }

  // Category display labels
  function getCategoryLabel(category: KeywordCandidate["category"]) {
    switch (category) {
      case "product":
        return "Product";
      case "aesthetic":
        return "Aesthetic";
      case "lifestyle":
        return "Lifestyle";
      case "problem_solution":
        return "Problem-Solution";
      case "long_tail":
        return "Long-Tail";
      default:
        return category;
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8F3] text-gray-900">
      {/* Header */}
      <header className="bg-[#174D36] px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-3xl font-bold tracking-tight">PinSolve AI</h1>

          <p className="mt-2 mx-auto max-w-xl text-sm text-green-100">
            Turn product photos into Pinterest-worthy pins. Discover new audiences
            and create marketing angles that help your products stand out.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10">
        {/* Introduction */}
        <div className="mb-8">
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-[#397653]">
            Create Campaign
          </p>

          <h2 className="mt-2 text-center text-2xl font-bold">
            Let&apos;s get started with your product image
          </h2>

          <p className="mt-2 text-center text-gray-600">
            Upload a product image and provide its details. PinSolve AI will
            analyze the product and generate marketing angles to help you create
            compelling Pinterest pins.
          </p>
        </div>

        {/* Product upload and details */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-semibold">1. Upload your product image</h3>

          <p className="mt-1 text-sm text-gray-500">
            PNG or JPG only, under 5MB.
          </p>

          <div className="mt-5 rounded-xl border-2 border-dashed border-[#A8C6AF] bg-[#F7FAF6] p-8 text-center">
            <div className="text-4xl text-[#397653]">↑</div>

            <p className="mt-3 font-medium">Upload your product image</p>

            <p className="mt-1 text-sm text-gray-500">
              Browse files from your computer
            </p>

            {previewUrl && (
              <div className="mt-5">
                <img
                  src={previewUrl}
                  alt="Uploaded product preview"
                  className="mx-auto max-h-64 rounded-xl object-contain"
                />
              </div>
            )}

            <input
              className="mx-auto mt-5 block max-w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#397653] file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-[#236345]"
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
                  setError("Please upload a valid PNG or JPG image under 5MB.");
                  setImage(null);
                  return;
                }

                setError(null);

                setProductAnalysis("");
                setIsAnalysisApproved(false);

                setMarketingAngles([]);
                setSelectedAngle(null);
                setChosenAngle(null);

                setKeywordCandidates([]);
                setSelectedKeywords([]);
                setKeywordError(null);

                setPinterestContent(null);
                setContentError(null);

                setImage(file);
              }}
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Product information */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold">2. Tell us about your product</h3>

            <p className="mt-1 text-sm text-gray-500">
              Give us details so PinSolve can create accurate, relevant and
              compelling marketing angles.
            </p>

            <label
              className="mt-5 block text-sm font-medium"
              htmlFor="productName"
            >
              Product Name *
            </label>

            <input
              id="productName"
              type="text"
              placeholder="e.g. Ninja Air Fryer"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none transition focus:border-[#397653] focus:ring-2 focus:ring-green-100"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />

            <label
              className="mt-5 block text-sm font-medium"
              htmlFor="productDescription"
            >
              Product Description *
            </label>

            <textarea
              id="productDescription"
              placeholder="Describe the product, its features and what it does..."
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none transition focus:border-[#397653] focus:ring-2 focus:ring-green-100"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
            />

            <label
              className="mt-5 block text-sm font-medium"
              htmlFor="targetAudience"
            >
              Target Audience{" "}
              <span className="ml-1 font-normal text-gray-400">(Optional)</span>
            </label>

            <input
              id="targetAudience"
              type="text"
              placeholder="e.g. Busy parents and families"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none transition focus:border-[#397653] focus:ring-2 focus:ring-green-100"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          {/* Analyze product button */}
          <button
            type="button"
            disabled={
              !image ||
              !productName.trim() ||
              !productDescription.trim() ||
              isLoading
            }
            className="mt-8 w-full rounded-xl bg-[#174D36] px-6 py-4 font-semibold text-white transition hover:bg-[#236345] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={analyzeProduct}
          >
            {isLoading ? "Analyzing your product..." : "Analyze Product"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Three distinct marketing approaches for every product.
          </p>
        </div>

        {/* Product analysis review and approval */}
        {productAnalysis && (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#397653]">
                AI Product Analysis
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Review your product information
              </h2>

              <p className="mt-2 text-gray-600">
                Check the analysis below and correct anything that needs adjustment.
                PinSolve AI will use your approved information to create
                marketing angles.
              </p>
            </div>

            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="productAnalysis"
            >
              Product Analysis
            </label>

            <textarea
              id="productAnalysis"
              value={productAnalysis}
              onChange={(e) => {
                setProductAnalysis(e.target.value);
                setIsAnalysisApproved(false);

                setMarketingAngles([]);
                setSelectedAngle(null);
                setChosenAngle(null);

                setKeywordCandidates([]);
                setSelectedKeywords([]);
                setKeywordError(null);

                setPinterestContent(null);
                setContentError(null);
              }}
              rows={16}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-4 text-sm leading-relaxed outline-none transition focus:border-[#397653] focus:ring-2 focus:ring-green-100"
            />

            <div className="mt-6 space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAnalysisApproved(true)}
                  disabled={!productAnalysis.trim()}
                  className="rounded-xl bg-[#174D36] px-6 py-3 font-semibold text-white transition hover:bg-[#103B39] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnalysisApproved ? "Analysis Approved ✓" : "Approve Analysis"}
                </button>
              </div>

              {isAnalysisApproved && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  Your product analysis has been approved. You can now generate
                  your marketing angles.
                </div>
              )}

              <button
                type="button"
                onClick={generateAngles}
                disabled={!isAnalysisApproved || isGeneratingAngles}
                className="w-full rounded-xl bg-[#174D36] px-6 py-4 font-semibold text-white transition hover:bg-[#236345] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingAngles
                  ? "Generating your marketing angles..."
                  : "Generate Marketing Angles"}
              </button>

              {angleError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {angleError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Marketing angle cards */}
        {marketingAngles.length > 0 && (
          <div className="mt-10">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#397653]">
                Your marketing strategy
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Three ways to reach your audience
              </h2>

              <p className="mt-2 text-gray-600">
                Choose the marketing angle you want to develop into a Pinterest pin.
              </p>
            </div>

            <div className="grid gap-5">
              {marketingAngles.map((angle, index) => (
                <button
                  key={`${angle.angle_type}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedAngle(index);
                    setChosenAngle(null);

                    setKeywordCandidates([]);
                    setSelectedKeywords([]);
                    setKeywordError(null);

                    setPinterestContent(null);
                    setContentError(null);
                  }}
                  className={`w-full rounded-2xl border-2 p-6 text-left transition ${selectedAngle === index
                      ? "border-[#174D36] bg-[#EDF5EE] shadow-md"
                      : "border-gray-200 bg-white hover:border-[#A8C6AF]"
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#397653]">
                      {angle.angle_type.replace(/-/g, " ")}
                    </span>

                    {selectedAngle === index && (
                      <span className="rounded-full bg-[#174D36] px-3 py-1 text-xs font-medium text-white">
                        Selected ✓
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-gray-900">
                    {angle.angle_name}
                  </h3>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Marketing message
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-gray-700">
                      {angle.marketing_message}
                    </p>
                  </div>

                  <div className="mt-5 rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Pinterest hook
                    </p>

                    <p className="mt-2 text-sm font-medium text-gray-800">
                      {angle.pinterest_hook}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Target audience
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {angle.target_audience}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Why this audience would respond
                    </p>

                    <p className="mt-1 text-sm leading-relaxed text-gray-700">
                      {angle.audience_motivation}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {selectedAngle !== null && (
              <button
                type="button"
                onClick={continueWithAngle}
                disabled={isGeneratingKeywords}
                className="mt-6 w-full rounded-xl bg-[#174D36] px-6 py-4 font-semibold text-white transition hover:bg-[#236345] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingKeywords
                  ? "Discovering keyword ideas..."
                  : "Continue with this angle →"}
              </button>
            )}
          </div>
        )}

        {/* Keyword discovery stage */}
        {chosenAngle && (
          <div className="mt-8 rounded-2xl border border-[#A8C6AF] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#397653]">
                Keyword Research
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Choose the keywords for your pin
              </h2>

              <p className="mt-2 text-gray-600">
                We&apos;ve suggested keywords based on your product and selected
                marketing angle. The recommended keywords are selected
                automatically, but you can customize your selection.
              </p>
            </div>

            {/* Selected angle summary */}
            <div className="mb-6 rounded-xl bg-[#F7FAF6] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#397653]">
                Selected marketing angle
              </p>

              <h3 className="mt-1 font-bold">{chosenAngle.angle_name}</h3>

              <p className="mt-2 text-sm text-gray-700">
                {chosenAngle.marketing_message}
              </p>
            </div>

            {/* Loading state */}
            {isGeneratingKeywords && (
              <div className="rounded-xl border border-[#A8C6AF] bg-[#F7FAF6] p-6 text-center">
                <p className="font-medium text-[#174D36]">
                  Discovering keyword ideas...
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Finding keywords that connect your product with relevant Pinterest
                  searches.
                </p>
              </div>
            )}

            {/* Keyword error */}
            {keywordError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {keywordError}
              </div>
            )}

            {/* Keyword suggestions */}
            {keywordCandidates.length > 0 && (
              <>
                <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold">
                      Suggested keywords ({selectedKeywords.length} selected)
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Recommended keywords are marked below.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={useRecommendedKeywords}
                    className="rounded-lg border border-[#174D36] px-4 py-2 text-sm font-medium text-[#174D36] transition hover:bg-[#EDF5EE]"
                  >
                    Use Recommended
                  </button>
                </div>

                <div className="grid gap-3">
                  {keywordCandidates.map((candidate, index) => {
                    const isSelected = selectedKeywords.includes(
                      candidate.keyword
                    );

                    return (
                      <label
                        key={`${candidate.keyword}-${index}`}
                        className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition ${isSelected
                            ? "border-[#174D36] bg-[#EDF5EE]"
                            : "border-gray-200 bg-white hover:border-[#A8C6AF]"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleKeyword(candidate.keyword)}
                          className="mt-1 h-4 w-4 accent-[#174D36]"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {candidate.keyword}
                            </span>

                            {candidate.recommended && (
                              <span className="rounded-full bg-[#174D36] px-2 py-1 text-xs font-medium text-white">
                                Recommended
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              {getCategoryLabel(candidate.category)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            {candidate.reason}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Selection summary */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold">
                    Your selected keywords
                  </p>

                  {selectedKeywords.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-[#174D36] px-3 py-2 text-sm text-white"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      You haven&apos;t selected any keywords yet.
                    </p>
                  )}
                </div>

                {/* Next stage placeholder */}
                <button
                  type="button"
                  disabled={selectedKeywords.length === 0 || isGeneratingContent}
                  className="mt-6 w-full rounded-xl bg-[#174D36] px-6 py-4 font-semibold text-white transition hover:bg-[#236345] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={generatePinterestContent}
                >
                  {isGeneratingContent
                    ? "Creating your Pinterest content..."
                    : "Generate Pinterest Content →"}
                </button>
                {contentError &&(
                    <div className="mt-4 rounded-xl border border-red-300 bg-red p-4 text-sm text-red-700">
                      {contentError}
                    </div>
                )}

                <p className="mt-3 text-center text-xs text-gray-400">
                  Pinterest content generation will use your selected keywords.
                </p>
              </>
            )}
          </div>
          
        )}
        {pinterestContent &&(
            <div className="mt-10 rounded-2xl border border-[#A8C6AF] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#397653]">
                Pinterest Content
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Review your pin content
              </h2>
              <p className="mt-2 text-gray-600">
                Your content has been generated using your {selectedAngle} and {selectedKeywords}.
                You can edit anything before moving forward.
              </p>
            </div>
            {/*pin title*/}
            <div className="mb-5">
              <label
              htmlFor="pinTitle"
              className="block text-sm font-semibold text-gray-700">
                Pinterest Title
              </label>
              <input
              id="pinTitle"
              type="text"
              value={pinterestContent.pin_title}
              onChange={(e)=>
                setPinterestContent((current)=>
                  current
              ? {...current, pin_title:e.target.value}
              :current
              )
            }
            className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none
            focus:border-[#397653] focus:ring-2 focus:ring-green-100"
            />
            </div>
            {/*pin description*/}
            <div className="mb-5">
              <label
                htmlFor="pinDescription"
                className="block text-sm font-semibold text-gray-700"
                >Pinterest description</label>
                <textarea
                  id="pinDescription"
                  rows ={6}
                  value={pinterestContent.pin_description}
                  onChange={(e)=>
                    setPinterestContent((current)=>
                      current
                      ? {...current, pin_description:e.target.value}
                      : current
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm leading-relaxed
              outline-none focus:border-[#397653] focus:ring-2 focus:ring-green-100"
              />                  
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Your Pinterest content is ready for review. Changes you make here are stored in the current session
            </div>
            </div>
          )}
      </section>
    </main>
  );
}
