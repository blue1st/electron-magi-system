import { Settings } from '../types';
import { sendChatCompletion } from './apiClient';

export async function generatePersonaWithAI(
  userRequirement: string,
  currentRoleName: string,
  settings: Settings
): Promise<{ personaDescription: string; suggestedRole: string }> {
  const prompt = `あなたは「MAGI System」のAI人格デザイナーです。
ユーザーが希望するAIのテーマ・役割・性格に基づいて、マギシステムで機能する【思考・行動・評価方針プロンプト】を作成してください。

【ユーザーからの要望・キーワード】:
"${userRequirement}" (現在の役割名: ${currentRoleName})

【出力要件】:
1. "suggestedRole": この人格にふさわしい短く明確な役割肩書 (例: "CYBER SECURITY ANALYST (セキュリティアナリスト)")
2. "personaDescription": この人格の価値観、優先順位、判断基準、口調・思考癖をまとめた3〜5箇条の行動方針箇条書きテキスト。

必ず以下のJSON形式で回答してください：
{
  "suggestedRole": "役割の名称",
  "personaDescription": "- 箇条書き1\\n- 箇条書き2\\n- 箇条書き3"
}`;

  const messages = [
    { role: 'system' as const, content: 'あなたは要求されたJSON形式のみを出力する優秀なプロンプト設計AIです。' },
    { role: 'user' as const, content: prompt }
  ];

  const responseText = await sendChatCompletion(settings, messages, settings.defaultModel, 0.7);

  try {
    const parsed = JSON.parse(responseText);
    return {
      suggestedRole: parsed.suggestedRole || currentRoleName,
      personaDescription: parsed.personaDescription || responseText
    };
  } catch (e) {
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || responseText.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          suggestedRole: parsed.suggestedRole || currentRoleName,
          personaDescription: parsed.personaDescription || responseText
        };
      } catch (err2) {}
    }
  }

  return {
    suggestedRole: currentRoleName,
    personaDescription: responseText
  };
}
