import { useState } from "react";
import { View } from "react-native";
import { Segment } from "../components/ui";
import { styles } from "../styles";
import { Budget, Category, DashboardSummary, ReceiptImportCandidate } from "../types";
import { BudgetScreen } from "./BudgetScreen";
import { OcrScreen } from "./OcrScreen";

export function DiscoverScreen({
  month,
  budgetAmount,
  budgets,
  summary,
  ocrText,
  ocrImageUri,
  extractingText,
  hasImageRecognitionKey,
  candidates,
  categories,
  onBudgetAmountChange,
  onSaveBudget,
  onOcrTextChange,
  onPickImage,
  onExtractText,
  onParseOcr,
  onToggleCandidate,
  onUpdateCandidate,
  onImportCandidates,
  onClearOcr,
  onOpenSettings
}: {
  month: string;
  budgetAmount: string;
  budgets: Budget[];
  summary: DashboardSummary;
  ocrText: string;
  ocrImageUri: string | null;
  extractingText: boolean;
  hasImageRecognitionKey: boolean;
  candidates: ReceiptImportCandidate[];
  categories: Category[];
  onBudgetAmountChange: (value: string) => void;
  onSaveBudget: () => void;
  onOcrTextChange: (value: string) => void;
  onPickImage: () => void;
  onExtractText: () => void;
  onParseOcr: () => void;
  onToggleCandidate: (id: string) => void;
  onUpdateCandidate: (id: string, patch: Partial<ReceiptImportCandidate>) => void;
  onImportCandidates: () => void;
  onClearOcr: () => void;
  onOpenSettings: () => void;
}) {
  const [mode, setMode] = useState<"ocr" | "budget">("ocr");

  return (
    <View>
      <View style={styles.discoverModeBar}>
        <Segment
          options={[
            { label: "票据识别", value: "ocr" },
            { label: "预算", value: "budget" }
          ]}
          value={mode}
          onChange={(value) => setMode(value as "ocr" | "budget")}
        />
      </View>
      {mode === "ocr" ? (
        <OcrScreen
          text={ocrText}
          imageUri={ocrImageUri}
          extracting={extractingText}
          hasImageRecognitionKey={hasImageRecognitionKey}
          candidates={candidates}
          categories={categories}
          onTextChange={onOcrTextChange}
          onPickImage={onPickImage}
          onExtractText={onExtractText}
          onParse={onParseOcr}
          onToggleCandidate={onToggleCandidate}
          onUpdateCandidate={onUpdateCandidate}
          onImportCandidates={onImportCandidates}
          onClear={onClearOcr}
          onOpenSettings={onOpenSettings}
        />
      ) : (
        <BudgetScreen
          month={month}
          budgetAmount={budgetAmount}
          budgets={budgets}
          summary={summary}
          onBudgetAmountChange={onBudgetAmountChange}
          onSave={onSaveBudget}
        />
      )}
    </View>
  );
}
