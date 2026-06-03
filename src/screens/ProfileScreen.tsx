import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { PrimaryButton, SectionTitle } from "../components/ui";
import { colors, styles } from "../styles";
import { Account, Category, ReceiptImageProvider, Transaction } from "../types";

export function ProfileScreen({
  categories,
  accounts,
  transactions,
  qwenApiKey,
  receiptImageProvider,
  onQwenApiKeyChange,
  onReceiptImageProviderChange,
  onTestQwenKey,
  onExportData
}: {
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  qwenApiKey: string;
  receiptImageProvider: ReceiptImageProvider;
  onQwenApiKeyChange: (value: string) => Promise<void> | void;
  onReceiptImageProviderChange: (value: ReceiptImageProvider) => Promise<void> | void;
  onTestQwenKey: (value: string) => void;
  onExportData: () => Promise<void> | void;
}) {
  const [editingProvider, setEditingProvider] = useState<"qwen" | null>(null);
  const [draftQwenKey, setDraftQwenKey] = useState(qwenApiKey);
  const [showQwenKey, setShowQwenKey] = useState(false);

  useEffect(() => {
    setDraftQwenKey(qwenApiKey);
  }, [qwenApiKey]);

  async function saveCurrentKey() {
    if (editingProvider === "qwen") {
      const nextKey = draftQwenKey.trim();
      if (!nextKey && qwenApiKey) {
        Alert.alert("确认清空 API Key", "清空后票据图片识别会不可用，重新填写后才能继续使用。", [
          { text: "取消", style: "cancel" },
          { text: "清空", style: "destructive", onPress: () => void persistQwenKey(nextKey) }
        ]);
        return;
      }
      await persistQwenKey(nextKey);
    }
  }

  async function persistQwenKey(nextKey: string) {
    await onQwenApiKeyChange(nextKey);
    if (receiptImageProvider !== "qwen") {
      await onReceiptImageProviderChange("qwen");
    }
    setEditingProvider(null);
    setShowQwenKey(false);
  }

  function cancelKeyEdit() {
    setDraftQwenKey(qwenApiKey);
    setShowQwenKey(false);
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

      <SectionTitle title="AI 识别" />
      <View style={styles.chartCard}>
        <Pressable style={styles.settingRow} onPress={() => setEditingProvider(editingProvider === "qwen" ? null : "qwen")}>
          <View style={styles.settingLeading}>
            <View style={styles.settingIcon}>
              <Ionicons name="scan" size={20} color={colors.text} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.settingTitle}>Qwen3-VL-Flash</Text>
              <Text style={styles.mutedText}>{qwenApiKey ? "已保存 DashScope API Key" : "用于票据、微信和支付宝截图识别"}</Text>
            </View>
          </View>
          <Text style={[styles.settingBadge, qwenApiKey && styles.settingBadgeActive]}>{qwenApiKey ? "已启用" : "设置"}</Text>
        </Pressable>
        {editingProvider ? (
          <View style={styles.settingEditor}>
            <TextInput
              value={draftQwenKey}
              onChangeText={setDraftQwenKey}
              secureTextEntry={!showQwenKey}
              placeholder="DashScope API Key"
              style={styles.input}
            />
            <View style={styles.settingActionRow}>
              <Text style={styles.linkText} onPress={() => setShowQwenKey((current) => !current)}>
                {showQwenKey ? "隐藏 Key" : "查看 Key"}
              </Text>
              <Text style={styles.linkText} onPress={cancelKeyEdit}>
                取消编辑
              </Text>
            </View>
            <View style={styles.wrapRow}>
              <View style={styles.flex}>
                <PrimaryButton label="测试 Key" onPress={() => onTestQwenKey(draftQwenKey)} disabled={!draftQwenKey.trim()} />
              </View>
              <View style={styles.flex}>
                <PrimaryButton label="保存并使用" onPress={saveCurrentKey} />
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <SectionTitle title="数据" />
      <View style={styles.chartCard}>
        <Pressable style={styles.settingRow} onPress={onExportData}>
          <View style={styles.settingLeading}>
            <View style={styles.settingIcon}>
              <Ionicons name="download-outline" size={20} color={colors.text} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.settingTitle}>导出账单 CSV</Text>
              <Text style={styles.mutedText}>备份、迁移或用表格软件继续分析。</Text>
            </View>
          </View>
          <Text style={styles.settingBadge}>导出</Text>
        </Pressable>
      </View>

      <SectionTitle title="记账管理" />
      <View style={styles.chartCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeading}>
            <View style={styles.settingIcon}>
              <Ionicons name="albums-outline" size={20} color={colors.text} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.settingTitle}>分类和账户</Text>
              <Text style={styles.mutedText}>已放到“记账”页，可在录入时快速新增。</Text>
            </View>
          </View>
          <Text style={styles.settingBadge}>记账页</Text>
        </View>
      </View>
    </View>
  );
}
