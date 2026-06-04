import { useState } from "react";
import { Text, View } from "react-native";
import { TransactionRow } from "../components/TransactionRow";
import { EmptyState, PrimaryButton } from "../components/ui";
import { styles } from "../styles";
import { Category, DashboardSummary, Transaction } from "../types";
import { formatMonthLabel } from "../utils/date";
import { formatMoney } from "../utils/money";

export function HomeScreen({
  summary,
  previousSummary,
  month,
  transactions,
  categories,
  onPreviousMonth,
  onNextMonth,
  onSelectMonth,
  onAdd,
  onEdit,
  onCopy,
  onDelete
}: {
  summary: DashboardSummary;
  previousSummary: DashboardSummary;
  month: string;
  transactions: Transaction[];
  categories: Category[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: (month: string) => void;
  onAdd: () => void;
  onEdit: (transaction: Transaction) => void;
  onCopy: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(Number(month.slice(0, 4)));
  const grouped = groupTransactionsByDate(transactions);
  const monthLabel = formatMonthLabel(month);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = Number(currentMonth.slice(0, 4));

  return (
    <View>
      <View style={styles.hero}>
        <View style={styles.monthSummaryRow}>
          <View style={styles.monthBlock}>
            <Text style={styles.monthYear} onPress={() => setShowMonthPicker((current) => !current)}>
              {monthLabel.slice(0, 4)}年
            </Text>
            <Text style={styles.monthText} onPress={() => setShowMonthPicker((current) => !current)}>
              {monthLabel.slice(5, 7)}
              <Text style={styles.monthUnit}>月</Text>
            </Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>收入</Text>
            <Text style={styles.summaryValue}>{formatMoney(summary.monthIncome).replace("¥", "")}</Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>支出</Text>
            <Text style={styles.summaryValue}>{formatMoney(summary.monthExpense).replace("¥", "")}</Text>
          </View>
        </View>
        {showMonthPicker ? (
          <View style={styles.monthPicker}>
            <View style={styles.monthPickerHeader}>
              <Text style={styles.monthSwitchText} onPress={() => setPickerYear((year) => year - 1)}>
                上一年
              </Text>
              <Text style={styles.monthPickerYear}>{pickerYear}年</Text>
              <Text
                style={[styles.monthSwitchText, pickerYear >= currentYear && styles.monthSwitchTextDisabled]}
                onPress={() => {
                  if (pickerYear < currentYear) {
                    setPickerYear((year) => year + 1);
                  }
                }}
              >
                下一年
              </Text>
            </View>
            <View style={styles.monthGrid}>
              {Array.from({ length: 12 }, (_, index) => {
                const nextMonth = `${pickerYear}-${String(index + 1).padStart(2, "0")}`;
                const active = nextMonth === month;
                const disabled = nextMonth > currentMonth;
                return (
                  <Text
                    key={nextMonth}
                    style={[styles.monthGridItem, active && styles.monthGridItemActive, disabled && styles.monthGridItemDisabled]}
                    onPress={() => {
                      if (disabled) {
                        return;
                      }
                      onSelectMonth(nextMonth);
                      setShowMonthPicker(false);
                    }}
                  >
                    {index + 1}月
                  </Text>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
      {transactions.length === 0 ? (
        <View>
          <EmptyState title="还没有账单" body="手动记一笔，或从票据识别结果确认入账。" />
          <PrimaryButton label="记一笔" onPress={onAdd} />
        </View>
      ) : (
        grouped.map((group) => (
          <View key={group.date}>
            <View style={styles.dayGroupHeader}>
              <Text style={styles.dayGroupTitle}>{formatDateLabel(group.date)}</Text>
              <View style={styles.dayGroupTotals}>
                {group.income > 0 ? <Text style={styles.dayGroupIncome}>收入 {formatMoney(group.income)}</Text> : null}
                <Text style={styles.dayGroupAmount}>支出 {formatMoney(group.expense)}</Text>
              </View>
            </View>
            {group.items.map((item) => (
              <TransactionRow
                key={item.id}
                transaction={item}
                categories={categories}
                onEdit={() => onEdit(item)}
                onCopy={() => onCopy(item)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </View>
        ))
      )}
    </View>
  );
}

function groupTransactionsByDate(transactions: Transaction[]): Array<{ date: string; expense: number; income: number; items: Transaction[] }> {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    groups.set(transaction.date, [...(groups.get(transaction.date) ?? []), transaction]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, items]) => ({
      date,
      items: [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
      expense: roundMoney(items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0)),
      income: roundMoney(items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0))
    }));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatDateLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${month}月${day}日`;
}
