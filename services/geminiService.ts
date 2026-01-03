
import { GoogleGenAI } from "@google/genai";

export async function generatePerspectiveImage(
  base64Image: string,
  rotation: { x: number; y: number }
): Promise<{ imageUrl: string; prompt: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';
  const imageData = base64Image.split(',')[1];

  // 逻辑：将旋转角度映射为模型更容易理解的方位词
  const azimuth = Math.round(-rotation.y % 360);
  const elevation = Math.round(-rotation.x % 360);

  // 语义化描述生成
  const getDirectionDesc = (az: number, el: number) => {
    let horizontal = "";
    const absAz = Math.abs(az);
    if (absAz < 15) horizontal = "Frontal view";
    else if (absAz < 60) horizontal = az > 0 ? "Three-quarter right profile" : "Three-quarter left profile";
    else if (absAz < 110) horizontal = az > 0 ? "Full right side profile" : "Full left side profile";
    else horizontal = "Rear perspective view";

    let vertical = "";
    if (el > 20) vertical = "from a high bird's-eye angle";
    else if (el < -20) vertical = "from a low worm's-eye angle";
    else vertical = "at eye-level";

    return `${horizontal} ${vertical}`;
  };

  const semanticView = getDirectionDesc(azimuth, elevation);

  const prompt = `ACT AS AN ADVANCED SPATIAL VISION RENDERER.
  
[INPUT ANALYSIS]
Analyze the provided image as a 3D subject centered in a coordinate system.

[TRANSFORMATION TASK]
Re-render the scene from a new camera position:
- VIEWPOINT: ${semanticView}
- COORDINATES: Azimuth ${azimuth}°, Elevation ${elevation}°

[RECONSTRUCTION RULES]
1. PARALLAX SHIFT: Move the camera horizontally by ${azimuth} degrees. The features on the ${azimuth > 0 ? 'left' : 'right'} side of the subject should now be hidden, while the ${azimuth > 0 ? 'right' : 'left'} side should be revealed with high fidelity.
2. VOLUME PRESERVATION: Maintain the exact 3D proportions and material textures of the original subject.
3. FORESHORTENING: Apply realistic perspective foreshortening based on the ${azimuth}° angle.
4. OCCLUSION HANDLING: Intelligently reconstruct (hallucinate) the textures and geometry that were previously hidden behind the subject in the frontal view.
5. LIGHTING CONSISTENCY: Keep the global illumination fixed while updating local shadows and specular highlights relative to the new camera orientation.

[OUTPUT]
High-quality 1024x1024 photorealistic rendering. No UI, no text, no borders. Just the re-imagined scene.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageData,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return {
          imageUrl: `data:image/png;base64,${part.inlineData.data}`,
          prompt: prompt
        };
      }
    }
    
    throw new Error("Gemini 3 Pro 未返回图像数据");
  } catch (error: any) {
    console.error("Gemini Pro Perspective Error:", error);
    if (error?.message?.includes("AUTH_ERROR") || error?.message?.includes("401")) {
      throw new Error("AUTH_ERROR");
    }
    throw error;
  }
}
