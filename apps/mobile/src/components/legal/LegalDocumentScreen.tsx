import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import type { LegalDocument } from '../../../../../shared/legal-content';
import { useThemeColors } from '../../contexts/ThemeContext';
import { borderRadius, fontFamily, space } from '../../theme';

function renderBlock(
  block: LegalDocument['sections'][number]['blocks'][number],
  styles: ReturnType<typeof makeStyles>,
  index: number,
) {
  switch (block.type) {
    case 'paragraph':
      return (
        <Text key={index} style={styles.paragraph}>
          {block.text}
        </Text>
      );
    case 'list':
      return (
        <View key={index} style={styles.listWrap}>
          {block.items.map((item) => (
            <View key={item} style={styles.listRow}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'table':
      return (
        <View key={index} style={styles.tableCard}>
          <View style={styles.tableHeader}>
            {block.headers.map((header) => (
              <Text key={header} style={styles.tableHeaderText}>
                {header}
              </Text>
            ))}
          </View>
          {block.rows.map((row) => (
            <View key={row.join('-')} style={styles.tableRow}>
              {row.map((cell, cellIndex) => (
                <Text
                  key={`${cell}-${cellIndex}`}
                  style={[
                    styles.tableCell,
                    cellIndex === 0 && cell.startsWith('authjs.') && styles.tableMono,
                  ]}
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    case 'contact':
      return (
        <View key={index} style={styles.contactCard}>
          {block.items.map((item) => (
            <TouchableOpacity
              key={`${item.label}-${item.value}`}
              activeOpacity={item.href ? 0.8 : 1}
              disabled={!item.href}
              onPress={() => item.href && Linking.openURL(item.href)}
              style={styles.contactRow}
            >
              <Text style={styles.contactLabel}>{item.label}</Text>
              <Text style={[styles.contactValue, item.href && styles.contactLink]}>
                {item.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export function LegalDocumentScreen({ document }: { document: LegalDocument }) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.title}>{document.title}</Text>
        {document.metaLines.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.meta}>
            {line}
          </Text>
        ))}
      </View>

      {document.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.blockWrap}>
            {section.blocks.map((block, index) => renderBlock(block, styles, index))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: 120, gap: space.md },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  blockWrap: { gap: space.md },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  listWrap: { gap: 10 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listBullet: { fontSize: 18, lineHeight: 22, color: colors.accent.DEFAULT },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  tableCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  tableMono: { fontFamily: fontFamily.medium },
  contactCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: space.md,
    gap: space.sm,
  },
  contactRow: { gap: 4 },
  contactLabel: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.textTertiary,
  },
  contactValue: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
  },
  contactLink: { color: colors.accent.DEFAULT },
});
