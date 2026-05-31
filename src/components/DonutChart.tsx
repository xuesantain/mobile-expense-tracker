import { Text, View } from "react-native";
import { colors, styles } from "../styles";
import { CategorySpend } from "../types";
import { formatMoney } from "../utils/money";

const chartColors = ["#ffd83d", "#2f2f33", "#8f8f8f", "#ffb020", "#e45656", "#13b981", "#6b7280"];
const tickCount = 72;

export function DonutChart({ items, total }: { items: CategorySpend[]; total: number }) {
  const positiveItems = items.filter((item) => item.amount > 0);
  const safeTotal = total > 0 ? total : positiveItems.reduce((sum, item) => sum + item.amount, 0);
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const fraction = (index + 0.5) / tickCount;
    return colorAt(fraction, positiveItems, safeTotal);
  });

  return (
    <View style={styles.chartCard}>
      <View style={styles.donutWrap}>
        <View style={styles.donut}>
          {ticks.map((color, index) => (
            <View key={`${color}-${index}`} style={[styles.donutTickWrap, { transform: [{ rotate: `${(360 / tickCount) * index}deg` }] }]}>
              <View style={[styles.donutTick, { backgroundColor: color }]} />
            </View>
          ))}
          <View style={styles.donutCenter}>
            <Text style={styles.donutLabel}>本月支出</Text>
            <Text style={styles.donutValue}>{formatMoney(safeTotal)}</Text>
          </View>
        </View>
      </View>

      {positiveItems.map((item, index) => {
        const percent = safeTotal > 0 ? Math.round((item.amount / safeTotal) * 100) : 0;
        return (
          <View key={item.categoryId} style={styles.legendRow}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: chartColors[index % chartColors.length] }]} />
              <Text style={styles.legendLabel}>{item.categoryName}</Text>
            </View>
            <Text style={styles.legendValue}>
              {percent}% · {formatMoney(item.amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function colorAt(fraction: number, items: CategorySpend[], total: number): string {
  if (!items.length || total <= 0) {
    return colors.border;
  }

  let cursor = 0;
  for (let index = 0; index < items.length; index += 1) {
    cursor += items[index].amount / total;
    if (fraction <= cursor || index === items.length - 1) {
      return chartColors[index % chartColors.length];
    }
  }

  return chartColors[0];
}
