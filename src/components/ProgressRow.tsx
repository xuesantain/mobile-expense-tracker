import { Text, View } from "react-native";
import { styles } from "../styles";
import { formatMoney } from "../utils/money";

export function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total > 0 ? Math.min(value / total, 1) : 0;
  return (
    <View style={styles.progressBlock}>
      <View style={styles.rowBetween}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{formatMoney(value)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent * 100}%` }]} />
      </View>
    </View>
  );
}
