import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { ChoiceWrap, PrimaryButton } from "../components/ui";
import { styles } from "../styles";
import { Category, ReceiptImportCandidate } from "../types";
import { formatMoney, parseAmount } from "../utils/money";

export function OcrScreen({
  text,
  imageUri,
  extracting,
  hasImageRecognitionKey,
  candidates,
  categories,
  onTextChange,
  onPickImage,
  onExtractText,
  onParse,
  onToggleCandidate,
  onUpdateCandidate,
  onImportCandidates,
  onClear,
  onOpenSettings
}: {
  text: string;
  imageUri: string | null;
  extracting: boolean;
  hasImageRecognitionKey: boolean;
  candidates: ReceiptImportCandidate[];
  categories: Category[];
  onTextChange: (value: string) => void;
  onPickImage: () => void;
  onExtractText: () => void;
  onParse: () => void;
  onToggleCandidate: (id: string) => void;
  onUpdateCandidate: (id: string, patch: Partial<ReceiptImportCandidate>) => void;
  onImportCandidates: () => void;
  onClear: () => void;
  onOpenSettings: () => void;
}) {
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const selectedCount = candidates.filter((item) => item.selected && item.amount && item.date && !item.duplicateOfTransactionId).length;
  const duplicateCount = candidates.filter((item) => item.duplicateOfTransactionId).length;
  const incompleteCount = candidates.filter((item) => !item.amount || !item.date).length;
  const hasSessionContent = Boolean(imageUri || text.trim() || candidates.length);

  return (
    <View>
      <Text style={styles.panelTitle}>票据识别</Text>
      <Text style={styles.mutedText}>先选择票据或账单截图，系统会提取候选账单。金额、日期、商户和分类仍需要你确认后才会入账。</Text>
      {!hasImageRecognitionKey ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>需要先配置 Qwen API Key</Text>
          <Text style={styles.mutedText}>配置后才能直接识别微信、支付宝或票据截图；未配置时仍可粘贴 OCR 文本后本地解析。</Text>
          <Text style={styles.linkText} onPress={onOpenSettings}>
            去设置 API Key
          </Text>
        </View>
      ) : null}
      <Pressable style={styles.secondaryButton} onPress={onPickImage}>
        <Ionicons name="image" size={18} color="#2563eb" />
        <Text style={styles.secondaryButtonText}>{imageUri ? "已选择图片，重新选择" : "选择票据截图"}</Text>
      </Pressable>
      {imageUri ? (
        <>
          <Text style={styles.uriText} numberOfLines={1}>
            {imageUri}
          </Text>
          <Pressable style={[styles.secondaryButton, (extracting || !hasImageRecognitionKey) && styles.disabledButton]} onPress={onExtractText} disabled={extracting || !hasImageRecognitionKey}>
            <Ionicons name="scan" size={18} color="#2563eb" />
            <Text style={styles.secondaryButtonText}>{extracting ? "正在提取..." : hasImageRecognitionKey ? "从图片提取文字" : "先配置 API Key"}</Text>
          </Pressable>
        </>
      ) : null}
      <Text style={styles.mutedText}>图片识别优先使用已配置的 Qwen3-VL-Flash。识别失败时不会自动入账，可以粘贴文本后重新解析。</Text>
      <TextInput
        value={text}
        onChangeText={onTextChange}
        placeholder={"粘贴 OCR 文本，例如\n瑞幸咖啡\n2026-05-30\n实付 32.00"}
        multiline
        style={styles.textArea}
      />
      <PrimaryButton label={extracting ? "正在识别..." : "解析候选账单"} onPress={onParse} disabled={extracting} />
      {hasSessionContent ? (
        <Text style={styles.entryViewRecordsAction} onPress={onClear}>
          清空本次识别
        </Text>
      ) : null}
      {candidates.length ? (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitleText}>导入确认</Text>
          <View style={styles.ocrSummaryRow}>
            <Text style={styles.ocrSummaryText}>可导入 {selectedCount} 条</Text>
            {duplicateCount ? <Text style={styles.duplicateText}>疑似重复 {duplicateCount} 条</Text> : null}
            {incompleteCount ? <Text style={styles.warningText}>待补全 {incompleteCount} 条</Text> : null}
          </View>
          {candidates.map((item) => {
            const isEditing = editingCandidateId === item.id;
            const needsCompletion = !item.amount || !item.date;
            return (
              <View key={item.id} style={styles.receiptCandidateRow}>
                <Pressable style={styles.receiptCandidateCheck} onPress={() => onToggleCandidate(item.id)}>
                  <Ionicons
                    name={item.selected ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={item.duplicateOfTransactionId || needsCompletion ? "#e45656" : item.selected ? "#2f2f33" : "#9ca3af"}
                  />
                </Pressable>
                <View style={styles.flex}>
                  <Text style={styles.transactionTitle}>{item.merchant || "未识别商户"}</Text>
                  <Text style={styles.transactionMeta}>
                    {item.date ?? "缺少日期"} {item.time ?? ""} · {item.note}
                  </Text>
                  {needsCompletion ? <Text style={styles.warningText}>信息不完整，点击编辑补全后再导入。</Text> : null}
                  {item.duplicateReason ? <Text style={styles.duplicateText}>疑似重复：{item.duplicateReason}</Text> : null}
                  {isEditing ? (
                    <View style={styles.receiptCandidateEditor}>
                      <View style={styles.wrapRow}>
                        <TextInput
                          value={item.amount ? String(item.amount) : ""}
                          onChangeText={(value) => {
                            const amount = parseAmount(value);
                            onUpdateCandidate(item.id, { amount: amount > 0 ? amount : null });
                          }}
                          keyboardType="decimal-pad"
                          placeholder="金额"
                          style={[styles.input, styles.receiptCandidateInput]}
                        />
                        <TextInput
                          value={item.date ?? ""}
                          onChangeText={(date) => onUpdateCandidate(item.id, { date: date.trim() || null })}
                          placeholder="日期 2026-05-31"
                          style={[styles.input, styles.receiptCandidateInput]}
                        />
                      </View>
                      <TextInput
                        value={item.merchant ?? ""}
                        onChangeText={(merchant) => onUpdateCandidate(item.id, { merchant: merchant.trim() || null })}
                        placeholder="商户/对象"
                        style={styles.input}
                      />
                      <ChoiceWrap
                        title="分类"
                        items={categories.filter((category) => category.type === item.type).map((category) => ({ id: category.id, label: category.name, icon: category.icon }))}
                        value={item.categoryId ?? ""}
                        onChange={(categoryId) => onUpdateCandidate(item.id, { categoryId })}
                      />
                      <Text style={styles.linkText} onPress={() => setEditingCandidateId(null)}>
                        收起编辑
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionAmount, item.type === "income" && styles.income]}>
                    {item.amount ? `${item.type === "income" ? "+" : "-"}${formatMoney(item.amount)}` : "缺金额"}
                  </Text>
                  <Pressable style={styles.iconAction} onPress={() => setEditingCandidateId(isEditing ? null : item.id)}>
                    <Ionicons name="create-outline" size={17} color={needsCompletion ? "#e45656" : "#9ca3af"} />
                  </Pressable>
                </View>
              </View>
            );
          })}
          <PrimaryButton label={`导入选中账单（${selectedCount}）`} onPress={onImportCandidates} disabled={selectedCount === 0} />
        </View>
      ) : null}
    </View>
  );
}
