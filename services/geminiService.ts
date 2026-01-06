import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { Patent } from "../types";

const SYSTEM_INSTRUCTION = `
你是一位專業的專利代理人與智慧財產權顧問助手。
你的職責是協助用戶管理專利組合，分析專利風險，提供年費維持建議。
請使用繁體中文 (zh-TW) 回答，保持專業、簡潔且精確。
`;

let chatSession: Chat | null = null;

/**
 * 取得或初始化 Gemini 對話 Session
 */
export const getChatSession = (): Chat => {
  if (!chatSession) {
    // 嚴格遵守安全性規範：僅從環境變數讀取 API Key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }
  return chatSession;
};

/**
 * 發送訊息給 Gemini 並獲取回應
 */
export const sendMessageToGemini = async (message: string, contextPatents?: Patent[]): Promise<string> => {
  try {
    const chat = getChatSession();
    let fullMessage = message;
    
    if (contextPatents && contextPatents.length > 0) {
      const patentContextString = contextPatents.slice(0, 10).map(p => 
        `[ID: ${p.id}, 名稱: ${p.name}, 狀態: ${p.status}, 國家: ${p.country}, 到期日: ${p.annuityDate}]`
      ).join('\n');
      
      fullMessage = `當前專利上下文：\n${patentContextString}\n\n用戶問題：${message}`;
    }

    const response: GenerateContentResponse = await chat.sendMessage({ message: fullMessage });
    return response.text || "抱歉，我現在無法回答您的問題。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "連線錯誤，請確認網路狀態或 API 配置。";
  }
};

const PATENT_SCHEMA_CONFIG = {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      patentee: { type: Type.STRING },
      country: { type: Type.STRING },
      status: { type: Type.STRING },
      type: { type: Type.STRING },
      appNumber: { type: Type.STRING },
      pubNumber: { type: Type.STRING },
      appDate: { type: Type.STRING },
      pubDate: { type: Type.STRING },
      duration: { type: Type.STRING },
      annuityDate: { type: Type.STRING },
      annuityYear: { type: Type.NUMBER },
      inventor: { type: Type.STRING },
      abstract: { type: Type.STRING },
    },
    required: ["name"]
  },
};

/**
 * 使用 AI 解析純文字中的專利資訊
 */
export const parsePatentFromText = async (text: string): Promise<Partial<Patent> | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `請將以下專利資訊解析為 JSON 格式：\n${text}`,
      config: PATENT_SCHEMA_CONFIG,
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Gemini Parse Text Error:", error);
    return null;
  }
};

/**
 * 使用 AI 解析檔案（如 PDF）中的專利資訊
 */
export const parsePatentFromFile = async (base64Data: string, mimeType: string = 'application/pdf'): Promise<Partial<Patent> | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "請從此文件中提取專利資訊並轉換為 JSON 格式。" }
        ]
      },
      config: PATENT_SCHEMA_CONFIG,
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Gemini Parse File Error:", error);
    return null;
  }
};