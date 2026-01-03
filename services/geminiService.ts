
import { GoogleGenAI } from "@google/genai";

export async function generatePerspectiveImage(
  base64Image: string,
  rotation: { x: number; y: number }
): Promise<{ imageUrl: string; prompt: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';
  const imageData = base64Image.split(',')[1];

  // 映射旋转角度为方位词
  const azimuth = Math.round(-rotation.y % 360);
  const elevation = Math.round(-rotation.x % 360);

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

  // 第一步：利用 Gemini 3 Flash 进行提示词优化，强制要求姿态一致性
  const optimizerResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: imageData,
            mimeType: mimeType,
          },
        },
        { 
          text: `你是一位顶级的 3D 摄影指导和 AI 提示词专家。
          
你的任务是：分析原图中的主体，并写下一段指令，让生成模型“旋转相机”到一个新视角：${semanticView} (方位角: ${azimuth}°, 仰角: ${elevation}°)。

核心原则：动作冻结（ACTION FREEZE）。
1. 必须精准描述主体的当前动作、肢体位置和姿势（Pose）。
2. 严禁改变主体的任何动态。如果他在跑，新图中也必须是同样的跨步动作；如果他在坐，新图中严禁站起。
3. 想象你正在围绕一个“蜡像”移动相机。描述在这个新视角下，主体原本被遮挡的侧面或背面应该呈现出什么样的视觉细节。
4. 保持服装、材质、光影色调与原图 100% 匹配。
5. 使用专业术语："Same static pose as source", "Frozen action", "Camera rotation only", "360-degree product photography", "Maintain anatomical consistency"。

请直接输出优化后的纯英文提示词。` 
        },
      ],
    },
  });

  const optimizedPrompt = optimizerResponse.text?.trim() || `A professional 3D camera rotation of the subject, maintaining the EXACT same pose and action as the source image, viewed from a ${semanticView} perspective.`;

  // 第二步：使用优化后的提示词调用 Gemini 3 Pro Image
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
          { text: `TASK: Rotate camera to ${semanticView}. STRICT REQUIREMENT: Keep the person's pose, limb positions, and facial expression IDENTICAL to the source image. DO NOT RE-IMAGINE THE ACTION. ONLY CHANGE THE VIEWING ANGLE. \n\nDetailed Description: ${optimizedPrompt}` },
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
          prompt: optimizedPrompt
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
