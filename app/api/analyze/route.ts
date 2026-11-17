export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const image = formData.get("image");

        const productName = formData.get("productName");
        const targetAudience = formData.get("targetAudience");


        //check if the image is valid image type is pngor jpg and size is less than 5mb
        if (!(image instanceof File)) {
            return Response.json({
                success: false,
                message: "Invalid image file. Please upload a valid image."
            }, { status: 400 });
        }
        //validate image type and size
        const validTypes = ["image/png", "image/jpeg"];
        if (!validTypes.includes(image.type)) {
            return Response.json({
                success: false,
                message: "Invalid image type. Please upload a PNG or JPEG image."
            }, { status: 400 });
        }
        if (image.size === 0 || image.size > 5 * 1024 * 1024) {// 5MB
            return Response.json({
                success: false,
                message: "Image size exceeds 5MB. Please upload a smaller image."
            }, { status: 400 });
        }
            //check if the image is valid image type is pngor jpg and size is less than 5mb
        const buffer = await image.arrayBuffer();
        const bytes =new Uint8Array(buffer);
        const isPNG=
            bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 && bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A ;
        const isJPEG=bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
        if ((
            image.type==="image.png" && !isPNG) || (image.type==="image.jpeg" && !isJPEG)) {
            return Response.json({
                success: false,
                message: "Invalid image type. Please upload a PNG or JPEG image."
            }, { status: 400 });
        }
        console.log("Received valid data:", {
            imageName: image.name,
            imageType: image.type,
            imageSize: image.size,
            productName,
            targetAudience,
        });
    }
    catch (error) {
        console.error("Error processing the request:", error);
        return Response.json({
            success: false,
            message: "An error occurred while processing the request."
        }, { status: 500 });
    }
    return Response.json({
        success: true,
        message: "Data received successfully"
    });
}
