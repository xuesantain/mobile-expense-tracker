import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { DonutChart } from "../components/DonutChart";
import { TrendChart, TrendPoint } from "../components/TrendChart";
import { EmptyState, SectionTitle } from "../components/ui";
import { styles } from "../styles";
import { CategorySpend, DashboardSummary, Transaction } from "../types";

type TrendRange = "day" | "month" | "year";

export function StatsScreen({
  spendByCategory,
  summary,
  transactions
}: {
  spendByCategory: CategorySpend[];
  summary: DashboardSummary;
  transactions: Transaction[];
}) {
  const [range, setRange] = useState<TrendRange>("day");
  const trendPoints = useMemo(() => buildTrendPoints(transactions, range), [transactions, range]);

  return (
    <View>
      <SectionTitle title="分类支出" />
      {spendByCategory.length === 0 ? (
        <EmptyState title="暂无统计" body="本月有支出后会展示分类占比。" />
      ) : (
        <DonutChart items={spendByCategory} total={summary.monthExpense} />
      )}

      <SectionTitle title="收支趋势" />
      <View style={styles.segment}>
        {[
          { label: "每日", value: "day" },
          { label: "每月", value: "month" },
          { label: "每年", value: "year" }
        ].map((item) => (
          <Text
            key={item.value}
            style={[styles.segmentItem, styles.segmentText, range === item.value && styles.segmentItemActive, range === item.value && styles.segmentTextActive]}
            onPress={() => setRange(item.value as TrendRange)}
          >
            {item.label}
          </Text>
        ))}
      </View>
      <TrendChart points={trendPoints} />
    </View>
  );
}

function buildTrendPoints(transactions: Transaction[], range: TrendRange): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();
  for (const transaction of transactions) {
    const label = labelFor(transaction.date, range);
    const current = buckets.get(label) ?? { label, expense: 0, income: 0 };
    current[transaction.type] += transaction.amount;
    buckets.set(label, current);
  }
  return [...buckets.values()]
    .sort((left, right) => left.label.localeCompare(right.label))
    .slice(-rangeLimit(range))
    .map((point) => ({
      ...point,
      expense: Math.round(point.expense * 100) / 100,
      income: Math.round(point.income * 100) / 100
    }));
}

function labelFor(date: string, range: TrendRange): string {
  if (range === "year") {
    return date.slice(0, 4);
  }
  if (range === "month") {
    return date.slice(0, 7);
  }
  return date.slice(5);
}

function rangeLimit(range: TrendRange): number {
  return range === "day" ? 14 : range === "month" ? 12 : 6;
}
