import React from "react";
import { Text, View } from "react-native";

import { documentListStyles as styles } from "@/src/styles/documentList.styles";

type DocumentStat = {
    label: string;
    value: string | number;
};

type DocumentPageHeaderProps = {
    title: string;
    subtitle: string;
    stats: DocumentStat[];
};

export default function DocumentPageHeader({
    title,
    subtitle,
    stats,
}: DocumentPageHeaderProps) {
    return (
        <>
            <View style={styles.header}>
                <Text style={styles.breadcrumb}>
                    Documents / Archives
                </Text>

                <Text style={styles.title}>
                    {title}
                </Text>

                <Text style={styles.subtitle}>
                    {subtitle}
                </Text>
            </View>

            <View style={styles.statsGrid}>
                {stats.map((stat) => (
                    <View
                        key={stat.label}
                        style={styles.statCard}
                    >
                        <Text style={styles.statLabel}>
                            {stat.label}
                        </Text>

                        <Text style={styles.statValue}>
                            {stat.value}
                        </Text>
                    </View>
                ))}
            </View>
        </>
    );
}