import { View } from "react-native";
import { BudgetScreen } from "./BudgetScreen";
import { OcrScreen } from "./OcrScreen";
import { styles } from "../styles";
import { Budget, Category, DashboardSummary, ReceiptImportCandidate } from "../types";

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
  onOpenSettings: () => void;
}) {
  return (
    <View>
      <BudgetScreen month={month} budgetAmount={budgetAmount} budgets={budgets} summary={summary} onBudgetAmountChange={onBudgetAmountChange} onSave={onSaveBudget} />
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
        onOpenSettings={onOpenSettings}
      />
    </View>
  );
}
