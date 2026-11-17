
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// STEP 1: Generate three Pinterest marketing angles
async function generateMarketingAngles(
    productAnalysis: string,
    productName: string,
    targetAudience: string
) {
    const prompt = `
You are a Pinterest marketing strategist.

Generate exactly THREE distinct Pinterest marketing angles
for the product described below.

PRODUCT NAME:
${productName || "Not provided"}

TARGET AUDIENCE:
${targetAudience || "Infer the most relevant audience from the product analysis."}

PRODUCT ANALYSIS:
${productAnalysis}

Create these three angles:

1. PROBLEM-FOCUSED
Focus on a specific problem or frustration the product can help address.

2. LIFESTYLE-FOCUSED
Focus on the lifestyle, experience or aspiration associated with using the product.

3. BENEFIT-FOCUSED
Focus on a practical product benefit supported by the analysis.

For EACH angle, provide:
- angle_type
- angle_name
- target_audience
- audience_motivation
- marketing_message
- pinterest_hook

IMPORTANT:
- Make all three angles genuinely different.
- Do not repeat the same selling point.
- Do not invent product features or performance claims.
- Distinguish supported facts from assumptions.
- Make each angle suitable for a separate Pinterest pin.

Return valid JSON only, without Markdown code fences.

Use this exact JSON structure:
{
  "angles": [
    {
      "angle_type": "problem-focused",
      "angle_name": "",
      "target_audience": "",
      "audience_motivation": "",
      "marketing_message": "",
      "pinterest_hook": ""
    },
    {
      "angle_type": "lifestyle-focused",
      "angle_name": "",
      "target_audience": "",
      "audience_motivation": "",
      "marketing_message": "",
      "pinterest_hook": ""
    },
    {
      "angle_type": "benefit-focused",
      "angle_name": "",
      "target_audience": "",
      "audience_motivation": "",
      "marketing_message": "",
      "pinterest_hook": ""
    }
  ]
}
`;

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ]
    });

    const textBlock = response.content.find(
        (block) => block.type === "text"
    );

    if (!textBlock) {
        throw new Error("Claude did not return any marketing angles.");
    }

    // Remove Markdown code fences if Claude includes them
    const cleanedText = textBlock.text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

    const result = JSON.parse(cleanedText);

    if (!Array.isArray(result.angles) || result.angles.length !== 3) {
        throw new Error("Claude did not return exactly three marketing angles.");
    }

    return result.angles;
}


// STEP 2: Handle the uploaded product image
export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const image = formData.get("image");

        const productNameValue = formData.get("productName");
        const targetAudienceValue = formData.get("targetAudience");

        const productName =
            typeof productNameValue === "string"
                ? productNameValue.trim()
                : "";

        const targetAudience =
            typeof targetAudienceValue === "string"
                ? targetAudienceValue.trim()
                : "";


        // STEP 3: Validate the uploaded image

        if (!(image instanceof File)) {
            return Response.json({
                success: false,
                message: "Invalid image file. Please upload a valid image."
            }, { status: 400 });
        }

        const validTypes = ["image/png", "image/jpeg"];

        if (!validTypes.includes(image.type)) {
            return Response.json({
                success: false,
                message: "Invalid image type. Please upload a PNG or JPEG image."
            }, { status: 400 });
        }

        if (image.size === 0 || image.size > 5 * 1024 * 1024) {
            return Response.json({
                success: false,
                message: "Image must not be empty or exceed 5MB."
            }, { status: 400 });
        }


        // STEP 4: Convert image into Base64

        const buffer = await image.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        const base64Image = Buffer.from(buffer).toString("base64");

        const mediaType = image.type as "image/png" | "image/jpeg";


        // STEP 5: Verify the actual image signature

        const isPNG =
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4E &&
            bytes[3] === 0x47 &&
            bytes[4] === 0x0D &&
            bytes[5] === 0x0A &&
            bytes[6] === 0x1A &&
            bytes[7] === 0x0A;

        const isJPEG =
            bytes[0] === 0xFF &&
            bytes[1] === 0xD8 &&
            bytes[2] === 0xFF;

        if (
            (image.type === "image/png" && !isPNG) ||
            (image.type === "image/jpeg" && !isJPEG)
        ) {
            return Response.json({
                success: false,
                message: "Image content does not match its declared file type."
            }, { status: 400 });
        }


        // STEP 6: Log the received product information

        console.log("Received valid data:", {
            imageName: image.name,
            imageType: image.type,
            imageSize: image.size,
            productName,
            targetAudience
        });


        // STEP 7: Ask Claude to analyse the product image

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2500,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType,
                                data: base64Image
                            }
                        },
                        {
                            type: "text",
                            text: `Analyse the product in this image.

Provide:
1. Product identification.
2. Visible physical features and packaging details.
3. Product claims explicitly visible on the packaging.
4. Likely intended use, clearly identified as an inference.
5. Details that cannot be confidently determined.

Important rules:
- Do not invent product specifications.
- Do not assume product availability or country of origin.
- Do not guess quantities or sizes if they are not clearly readable.
- Separate visible facts from assumptions.
- If uncertain, say so.
- Never introduce product details, quantities, age ranges,materials, or specifications that are not supported
by the product analysis.
-Marketing creativity is encouraged, but factual claims
must remain grounded in the available evidence.
`
                        }
                    ]
                }
            ]
        });


        // STEP 8: Extract Claude's product analysis

        const analysisBlock = message.content.find(
            (block) => block.type === "text"
        );

        if (!analysisBlock) {
            throw new Error("Claude did not return a product analysis.");
        }

        const productAnalysis = analysisBlock.text;

        console.log("Product analysis completed.");


        // STEP 9: Generate three marketing angles

        const marketingAngles = await generateMarketingAngles(
            productAnalysis,
            productName,
            targetAudience
        );

        console.log("Marketing angles generated:", marketingAngles);


        // STEP 10: Return both results to the frontend

        return Response.json({
            success: true,
            analysis: productAnalysis,
            marketingAngles: marketingAngles
        });

    } catch (error) {
        console.error("Error processing the request:", error);

        return Response.json({
            success: false,
            message: "An error occurred while analysing the product."
        }, { status: 500 });
    }
}
