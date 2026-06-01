import { useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import { TransactionType } from "../types";
import { formatMoney } from "../utils/money";

export type TrendPoint = {
  label: string;
  expense: number;
  income: number;
};

const chartHeight = 150;
const labelHeight = 30;
const nodeSize = 11;
const lineThickness = 2;

export function TrendChart({ points, metric }: { points: TrendPoint[]; metric: TransactionType }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [plotWidth, setPlotWidth] = useState(0);
  const values = points.map((point) => point[metric]);
  const total = Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100;
  const average = points.length ? Math.round((total / points.length) * 100) / 100 : 0;
  const actualMaxValue = Math.max(...values, 0);
  const maxValue = Math.max(actualMaxValue, 1);
  const selected = selectedIndex === null ? null : points[selectedIndex] ?? null;
  const nodes = useMemo(() => layoutNodes(points, metric, maxValue, plotWidth), [points, metric, maxValue, plotWidth]);

  function handlePlotLayout(event: LayoutChangeEvent) {
    setPlotWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.flatTrendCard}>
      <View style={styles.trendMetaRow}>
        <View>
          <Text style={styles.trendMetaText}>总{metric === "expense" ? "支出" : "收入"}：{formatMoney(total)}</Text>
          <Text style={styles.trendMetaText}>平均值：{formatMoney(average)}</Text>
        </View>
        <Text style={styles.trendMaxText}>{formatMoney(actualMaxValue)}</Text>
      </View>
      {selected ? (
        <Text style={styles.trendSelectedText}>
          {selected.label} {metric === "expense" ? "支出" : "收入"} {formatMoney(selected[metric])}
        </Text>
      ) : null}
      <View style={styles.simpleLinePlot} onLayout={handlePlotLayout}>
        <View style={styles.gridLineTop} />
        <View style={styles.gridLineMiddle} />
        <View style={styles.gridLineBottom} />
        {plotWidth > 0 ? (
          <View style={styles.lineSeries}>
            {nodes.slice(0, -1).map((node, index) => renderSegment(node, nodes[index + 1], `${metric}-${node.label}-${index}`))}
          </View>
        ) : null}
        <View style={styles.lineTapLayer}>
          {nodes.map((node, index) => (
            <Pressable key={`${node.label}-${index}`} style={[styles.lineTapColumn, { left: node.columnLeft, width: node.columnWidth }]} onPress={() => setSelectedIndex(index)}>
              <View
                style={[
                  styles.singleLineNode,
                  index === selectedIndex && styles.singleLineNodeActive,
                  {
                    left: node.x - node.columnLeft - nodeSize / 2,
                    bottom: node.bottom - nodeSize / 2,
                    backgroundColor: node.value > 0 ? "#ffd83d" : "#fff"
                  }
                ]}
              />
              <Text style={styles.trendLabel}>{node.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

type NodeLayout = {
  label: string;
  value: number;
  x: number;
  bottom: number;
  columnLeft: number;
  columnWidth: number;
};

function layoutNodes(points: TrendPoint[], key: TransactionType, maxValue: number, plotWidth: number): NodeLayout[] {
  const count = points.length;
  const columnWidth = count > 0 ? plotWidth / count : 0;
  return points.map((point, index) => {
    const x = columnWidth * index + columnWidth / 2;
    return {
      label: point.label,
      value: point[key],
      x,
      bottom: labelHeight + pointBottom(point[key], maxValue),
      columnLeft: columnWidth * index,
      columnWidth
    };
  });
}

function renderSegment(start: NodeLayout, end: NodeLayout, key: string) {
  const dx = end.x - start.x;
  const dy = end.bottom - start.bottom;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(-dy, dx) * (180 / Math.PI);

  return (
    <View
      key={key}
      style={[
        styles.lineSegment,
        {
          left: start.x + dx / 2 - length / 2,
          bottom: start.bottom + dy / 2 - lineThickness / 2,
          width: length,
          backgroundColor: "#3d3d42",
          transform: [{ rotate: `${angle}deg` }]
        }
      ]}
    />
  );
}

function pointBottom(value: number, maxValue: number): number {
  return Math.max((value / maxValue) * chartHeight, value ? 6 : 0);
}
