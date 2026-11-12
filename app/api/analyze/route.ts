export async function POST(request:Request){
    const formData = await request.formData();
    
    const image = formData.get("image");
    const productName = formData.get("productName");
    const targetAudience = formData.get("targetAudience");
    
    console.log('Received data:', 
        { image, 
            productName, 
            targetAudience 
});
return Response.json({ 
    success: true,
    message: "Data received successfully" });
}