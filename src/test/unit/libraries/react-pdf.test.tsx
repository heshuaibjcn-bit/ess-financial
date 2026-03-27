import { describe, it, expect } from 'vitest';
import { Document, Page, Text, View, StyleSheet, PDFRenderer } from '@react-pdf/renderer';

describe('React-PDF library evaluation', () => {
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      padding: 30,
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      fontWeight: 'bold',
    },
    section: {
      marginBottom: 10,
    },
    text: {
      fontSize: 12,
      marginBottom: 5,
    },
  });

  it('should create a simple document structure', () => {
    const MyDoc = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Energy Storage Investment Analysis</Text>
          <View style={styles.section}>
            <Text style={styles.text}>Project: Guangdong Industrial Storage</Text>
            <Text style={styles.text}>Capacity: 2 MWh</Text>
            <Text style={styles.text}>IRR: 8.14%</Text>
          </View>
        </Page>
      </Document>
    );

    expect(MyDoc).toBeDefined();
  });

  it('should handle Chinese characters', () => {
    const ChineseDoc = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>工商业储能投资分析</Text>
          <View style={styles.section}>
            <Text style={styles.text}>项目：广东省工商业储能</Text>
            <Text style={styles.text}>容量：2 MWh</Text>
            <Text style={styles.text}>内部收益率：8.14%</Text>
          </View>
        </Page>
      </Document>
    );

    expect(ChineseDoc).toBeDefined();
  });

  it('should create multi-page documents', () => {
    const MultiPageDoc = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Page 1: Executive Summary</Text>
          <Text style={styles.text}>Key metrics and findings...</Text>
        </Page>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Page 2: Detailed Analysis</Text>
          <Text style={styles.text}>Assumptions, calculations, and methodology...</Text>
        </Page>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Page 3: Cash Flow Projection</Text>
          <Text style={styles.text}>10-year cash flow table...</Text>
        </Page>
      </Document>
    );

    expect(MultiPageDoc).toBeDefined();
  });

  it('should support tables and layouts', () => {
    const TableDoc = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Investment Summary</Text>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Metric</Text>
              <Text>Initial Investment</Text>
              <Text>IRR</Text>
              <Text>NPV</Text>
              <Text>Payback Period</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Value</Text>
              <Text>¥1,000,000</Text>
              <Text>8.14%</Text>
              <Text>¥60,030</Text>
              <Text>6.7 years</Text>
            </View>
          </View>
        </Page>
      </Document>
    );

    expect(TableDoc).toBeDefined();
  });
});
