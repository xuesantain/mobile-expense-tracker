import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { PrimaryButton } from "../components/ui";
import { styles } from "../styles";
import { ReceiptImportCandidate } from "../types";
import { formatMoney } from "../utils/money";

export function OcrScreen({
  text,
  imageUri,
  extracting,
  candidates,
  onTextChange,
  onPickImage,
  onExtractText,
  onParse,
  onToggleCandidate,
  onImportCandidates
}: {
  text: string;
  imageUri: string | null;
  extracting: boolean;
  candidates: ReceiptImportCandidate[];
  onTextChange: (value: string) => void;
  onPickImage: () => void;
  onExtractText: () => void;
  onParse: () => void;
  onToggleCandidate: (id: string) => void;
  onImportCandidates: () => void;
}) {
  const selectedCount = candidates.filter((item) => item.selected && item.amount && item.date && !item.duplicateOfTransactionId).length;
  const duplicateCount = candidates.filter((item) => item.duplicateOfTransactionId).length;
  const incompleteCount = candidates.filter((item) => !item.amount || !item.date).length;

  return (
    <View>
      <Text style={styles.panelTitle}>票据识别</Text>
      <Text style={styles.mutedText}>先选择票据图片并提取文字，或直接粘贴 OCR 文本。解析出的金额、日期、商户和分类仍需确认后才会入账。</Text>
      <Pressable style={styles.secondaryButton} onPress={onPickImage}>
        <Ionicons name="image" size={18} color="#2563eb" />
        <Text style={styles.secondaryButtonText}>{imageUri ? "已选择图片，重新选择" : "选择票据截图"}</Text>
      </Pressable>
      {imageUri ? (
        <>
          <Text style={styles.uriText} numberOfLines={1}>
            {imageUri}
          </Text>
          <Pressable style={[styles.secondaryButton, extracting && styles.disabledButton]} onPress={onExtractText} disabled={extracting}>
            <Ionicons name="scan" size={18} color="#2563eb" />
            <Text style={styles.secondaryButtonText}>{extracting ? "正在提取..." : "从图片提取文字"}</Text>
          </Pressable>
        </>
      ) : null}
      <Text style={styles.mutedText}>图片识别会优先使用已配置的 Qwen3-VL-Flash。识别失败时不会自动入账，可改用粘贴文本后本地解析。</Text>
      <TextInput
        value={text}
        onChangeText={onTextChange}
        placeholder={"粘贴 OCR 文本，例如\n瑞幸咖啡\n2026-05-30\n实付 32.00"}
        multiline
        style={styles.textArea}
      />
      <PrimaryButton label={extracting ? "正在识别..." : "解析候选账单"} onPress={onParse} disabled={extracting} />
      {candidates.length ? (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitleText}>导入确认</Text>
          <View style={styles.ocrSummaryRow}>
            <Text style={styles.ocrSummaryText}>可导入 {selectedCount} 条</Text>
            {duplicateCount ? <Text style={styles.duplicateText}>疑似重复 {duplicateCount} 条</Text> : null}
            {incompleteCount ? <Text style={styles.warningText}>待补全 {incompleteCount} 条</Text> : null}
          </View>
          {candidates.map((item) => (
            <Pressable key={item.id} style={styles.receiptCandidateRow} onPress={() => onToggleCandidate(item.id)}>
              <View style={styles.receiptCandidateCheck}>
                <Ionicons
                  name={item.selected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={item.duplicateOfTransactionId || !item.amount || !item.date ? "#e45656" : item.selected ? "#2f2f33" : "#9ca3af"}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.transactionTitle}>{item.merchant || "未识别商户"}</Text>
                <Text style={styles.transactionMeta}>
                  {item.date ?? "缺少日期"} {item.time ?? ""} · {item.note}
                </Text>
                {!item.amount || !item.date ? <Text style={styles.warningText}>信息不完整，请取消选择或手动补充后再导入。</Text> : null}
                {item.duplicateReason ? <Text style={styles.duplicateText}>疑似重复：{item.duplicateReason}</Text> : null}
              </View>
              <Text style={[styles.transactionAmount, item.type === "income" && styles.income]}>
                {item.amount ? `${item.type === "income" ? "+" : "-"}${formatMoney(item.amount)}` : "缺金额"}
              </Text>
            </Pressable>
          ))}
          <PrimaryButton label={`导入选中账单（${selectedCount}）`} onPress={onImportCandidates} disabled={selectedCount === 0} />
        </View>
      ) : null}
    </View>
  );
}
