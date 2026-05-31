import { Text, View } from "react-native";
import { EmptyState, Field, PrimaryButton, SectionTitle } from "../components/ui";
import { ProgressRow } from "../components/ProgressRow";
import { styles } from "../styles";
import { Budget, DashboardSummary } from "../types";
import { formatMonthLabel } from "../utils/date";
import { formatMoney } from "../utils/money";

export function BudgetScreen({
  month,
  budgetAmount,
  budgets,
  summary,
  onBudgetAmountChange,
  onSave
}: {
  month: string;
  budgetAmount: string;
  budgets: Budget[];
  summary: DashboardSummary;
  onBudgetAmountChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <View>
      <Field label={`${formatMonthLabel(month)} 总预算`} value={budgetAmount} onChangeText={onBudgetAmountChange} keyboardType="decimal-pad" />
      <PrimaryButton label="保存预算" onPress={onSave} />
      <SectionTitle title="预算进度" />
      <ProgressRow label="本月支出" value={summary.monthExpense} total={summary.monthBudget || summary.monthExpense || 1} />
      <Text style={styles.mutedText}>{summary.remainingBudget === null ? "设置预算后可以追踪剩余额度。" : `剩余 ${formatMoney(summary.remainingBudget)}`}</Text>
      <SectionTitle title="预算记录" />
      {budgets.length === 0 ? (
        <EmptyState title="暂无预算" body="先设置本月总预算。" />
      ) : (
        budgets.map((item) => (
          <View key={item.id} style={styles.statLine}>
            <Text style={styles.statLabel}>{item.categoryId ?? "全部分类"}</Text>
            <Text style={styles.statValue}>{formatMoney(item.amount)}</Text>
          </View>
        ))
      )}
    </View>
  );
}
