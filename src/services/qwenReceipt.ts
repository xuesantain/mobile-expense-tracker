import * as FileSystem from "expo-file-system";
import { Account, Category } from "../types";
import { parseStructuredReceiptItemsFromJson, StructuredReceiptItem } from "../utils/receiptImport";

const qwenApiUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

export async function structureReceiptImageWithQwen({
  apiKey,
  imageUri,
  categories,
  accounts
}: {
  apiKey: string;
  imageUri: string;
  categories: Category[];
  accounts: Account[];
}): Promise<StructuredReceiptItem[]> {
  if (!apiKey.trim()) {
    return [];
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
  const mimeType = imageUri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

  const response = await fetch(qwenApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: "qwen3-vl-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildReceiptPrompt(categories, accounts)
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Qwen 图片识别失败：${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  return parseStructuredReceiptItemsFromJson(content);
}

export async function testQwenApiKey(apiKey: string): Promise<void> {
  const response = await fetch(qwenApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: "qwen3-vl-flash",
      messages: [{ role: "user", content: [{ type: "text", text: "只回复 OK" }] }]
    })
  });

  if (!response.ok) {
    throw new Error(`Qwen Key 测试失败：${response.status}`);
  }
}

function buildReceiptPrompt(categories: Category[], accounts: Account[]): string {
  const categoryNames = categories.map((item) => item.name).join("、");
  const accountNames = accounts.map((item) => item.name).join("、");
  return [
    "请从这张微信、支付宝或票据截图中提取记账记录。",
    "只返回 JSON，不要解释，不要输出 Markdown。",
    "如果截图是账单列表，每一行左侧通常是商户，中间或下方是日期时间，最右侧通常是金额。必须把最右侧金额绑定到同一行。",
    "逐条交易只提取列表行金额，不要把顶部月汇总、总支出或总收入当成单条交易。",
    "金额可能显示为 -115.70、+344.00、¥10.50、支出 ¥6735.19。负数或支出返回 type=expense，正数或收入返回 type=income。amount 必须返回正数数值，不带符号。",
    "如果金额在截图中可见，不允许返回 null。商户过长可以截断，但不要丢金额。",
    "merchant 字段填写具体商铺、收款方或付款方，不要填写分类名。",
    "可用分类：" + categoryNames + "。",
    "可用账户：" + accountNames + "。",
    "分类规则：饭店、咖啡、奶茶、外卖、餐馆、食堂归入餐饮；公交、地铁、打车、火车归入交通；电商、超市、商场归入购物；医院、药店归入医疗；影院、游戏、会员归入娱乐。如果用户新增分类且商户语义更匹配新增分类，优先返回该新增分类名。",
    'JSON 格式：{"records":[{"amount":数字或null,"type":"expense或income","merchant":"商户或null","date":"YYYY-MM-DD或null","time":"HH:mm或null","categoryName":"分类名或null","accountName":"账户名或null","note":"备注或null","confidence":0到1}]}。',
    "如果截图中有多条交易，records 返回多条。"
  ].join("\n");
}
