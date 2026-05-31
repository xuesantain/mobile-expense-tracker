import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { PrimaryButton, SectionTitle } from "../components/ui";
import { styles } from "../styles";
import { Account, Category, ReceiptImageProvider, Transaction } from "../types";

export function ProfileScreen({
  categories,
  accounts,
  transactions,
  qwenApiKey,
  receiptImageProvider,
  onQwenApiKeyChange,
  onReceiptImageProviderChange,
  onTestQwenKey
}: {
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  qwenApiKey: string;
  receiptImageProvider: ReceiptImageProvider;
  onQwenApiKeyChange: (value: string) => void;
  onReceiptImageProviderChange: (value: ReceiptImageProvider) => void;
  onTestQwenKey: (value: string) => void;
}) {
  const [editingProvider, setEditingProvider] = useState<"qwen" | null>(null);
  const [draftQwenKey, setDraftQwenKey] = useState(qwenApiKey);

  function saveCurrentKey() {
    if (editingProvider === "qwen") {
      onQwenApiKeyChange(draftQwenKey);
      onReceiptImageProviderChange("qwen");
    }
    setEditingProvider(null);
  }

  return (
    <View>
      <View style={styles.profileHero}>
        <Text style={styles.profileName}>设置</Text>
        <View style={styles.profileStats}>
          <View>
            <Text style={styles.profileStatValue}>{categories.length}</Text>
            <Text style={styles.profileStatLabel}>分类</Text>
          </View>
          <View>
            <Text style={styles.profileStatValue}>{accounts.length}</Text>
            <Text style={styles.profileStatLabel}>账户</Text>
          </View>
          <View>
            <Text style={styles.profileStatValue}>{transactions.length}</Text>
            <Text style={styles.profileStatLabel}>账单</Text>
          </View>
        </View>
      </View>

      <SectionTitle title="AI 识别设置" />
      <View style={styles.chartCard}>
        <Text style={styles.statLabel}>图片识别模型</Text>
        <Pressable style={styles.settingRow} onPress={() => setEditingProvider("qwen")}>
          <View>
            <Text style={styles.statLabel}>Qwen3-VL-Flash 图片识别</Text>
            <Text style={styles.mutedText}>{qwenApiKey ? "已配置 Key" : "未配置，点击填写 DashScope API Key"}</Text>
          </View>
          <Text style={styles.statValue}>{receiptImageProvider === "qwen" ? "使用中" : "设置"}</Text>
        </Pressable>
        {editingProvider ? (
          <View style={styles.settingEditor}>
            <Text style={styles.statLabel}>填写 Qwen API Key</Text>
            <TextInput
              value={draftQwenKey}
              onChangeText={setDraftQwenKey}
              secureTextEntry
              placeholder="DashScope API Key"
              style={styles.input}
            />
            <PrimaryButton label="测试 Key" onPress={() => onTestQwenKey(draftQwenKey)} />
            <PrimaryButton label="保存并使用" onPress={saveCurrentKey} />
          </View>
        ) : null}
      </View>

      <SectionTitle title="记账管理" />
      <View style={styles.chartCard}>
        <Text style={styles.mutedText}>分类和账户已移到“记账”页，可以在记账时快速新增，减少来回切换。</Text>
      </View>
    </View>
  );
}
