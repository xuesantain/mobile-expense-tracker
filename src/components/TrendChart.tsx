import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import { formatMoney } from "../utils/money";

export type TrendPoint = {
  label: string;
  expense: number;
  income: number;
};

const chartHeight = 150;

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const maxValue = Math.max(...points.map((point) => Math.max(point.expense, point.income)), 1);
  const selected = selectedIndex === null ? null : points[selectedIndex] ?? null;

  return (
    <View style={styles.chartCard}>
      <View style={styles.trendLegend}>
        <Text style={styles.legendValue}>支出</Text>
        <Text style={styles.income}>收入</Text>
      </View>
      {selected ? (
        <Text style={styles.trendSelectedText}>
          {selected.label}  支出 {formatMoney(selected.expense)} / 收入 {formatMoney(selected.income)}
        </Text>
      ) : (
        <Text style={styles.mutedText}>点击节点查看金额</Text>
      )}
      <View style={styles.lineChartWrap}>
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{formatMoney(maxValue)}</Text>
          <Text style={styles.axisLabel}>{formatMoney(maxValue / 2)}</Text>
          <Text style={styles.axisLabel}>¥0.00</Text>
        </View>
        <View style={styles.linePlot}>
          <View style={styles.gridLineTop} />
          <View style={styles.gridLineMiddle} />
          <View style={styles.gridLineBottom} />
          <View style={styles.lineSeries}>{renderSegments(points, maxValue, "expense")}</View>
          <View style={styles.lineSeries}>{renderSegments(points, maxValue, "income")}</View>
          <View style={styles.lineNodes}>
            {points.map((point, index) => (
              <Pressable key={point.label} style={styles.linePointColumn} onPress={() => setSelectedIndex(index)}>
                <View style={[styles.lineNode, { bottom: pointBottom(point.expense, maxValue), backgroundColor: "#ffd83d" }]} />
                <View style={[styles.lineNode, { bottom: pointBottom(point.income, maxValue), backgroundColor: "#13b981" }]} />
                <Text style={styles.trendLabel}>{point.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function renderSegments(points: TrendPoint[], maxValue: number, key: "expense" | "income") {
  return points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const y1 = pointBottom(point[key], maxValue);
    const y2 = pointBottom(next[key], maxValue);
    const delta = y2 - y1;
    const angle = Math.atan2(delta, 1) * (180 / Math.PI);
    const color = key === "expense" ? "#ffd83d" : "#13b981";
    return (
      <View
        key={`${key}-${point.label}-${next.label}`}
        style={[
          styles.lineSegment,
          {
            left: `${(index / Math.max(points.length - 1, 1)) * 100}%`,
            bottom: y1 + 6,
            width: `${100 / Math.max(points.length - 1, 1)}%`,
            backgroundColor: color,
            transform: [{ rotate: `${-angle}deg` }]
          }
        ]}
      />
    );
  });
}

function pointBottom(value: number, maxValue: number): number {
  return Math.max((value / maxValue) * chartHeight, value ? 6 : 0);
}
