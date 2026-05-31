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
          <Pressable style={styles.secondaryButton} onPress={onExtractText}>
            <Ionicons name="scan" size={18} color="#2563eb" />
            <Text style={styles.secondaryButtonText}>{extracting ? "正在提取..." : "从图片提取文字"}</Text>
          </Pressable>
        </>
      ) : null}
      <Text style={styles.mutedText}>DeepSeek Key 不建议直接放在 App 页面里。未配置服务时会使用本地规则解析 OCR 文本；后续可改为后端代理自动结构化。</Text>
      <TextInput
        value={text}
        onChangeText={onTextChange}
        placeholder={"粘贴 OCR 文本，例如\n瑞幸咖啡\n2026-05-30\n实付 32.00"}
        multiline
        style={styles.textArea}
      />
      <PrimaryButton label="解析候选账单" onPress={onParse} />
      {candidates.length ? (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitleText}>导入确认</Text>
          {candidates.map((item) => (
            <Pressable key={item.id} style={styles.receiptCandidateRow} onPress={() => onToggleCandidate(item.id)}>
              <View style={styles.receiptCandidateCheck}>
                <Ionicons name={item.selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={item.selected ? "#2f2f33" : "#9ca3af"} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.transactionTitle}>{item.merchant || "未识别商户"}</Text>
                <Text style={styles.transactionMeta}>
                  {item.date ?? "缺少日期"} {item.time ?? ""} · {item.note}
                </Text>
                {item.duplicateReason ? <Text style={styles.duplicateText}>疑似重复：{item.duplicateReason}</Text> : null}
              </View>
              <Text style={[styles.transactionAmount, item.type === "income" && styles.income]}>
                {item.amount ? `${item.type === "income" ? "+" : "-"}${formatMoney(item.amount)}` : "缺金额"}
              </Text>
            </Pressable>
          ))}
          <PrimaryButton label="导入选中账单" onPress={onImportCandidates} />
        </View>
      ) : null}
    </View>
  );
}
