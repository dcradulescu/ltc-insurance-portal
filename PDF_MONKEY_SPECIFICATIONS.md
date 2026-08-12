# PDF Monkey Template Specifications - Complete Report

## 📐 Page Sizes (Engine v5 - Current Standard)

| Format | Pixels | Millimeters | Inches |
|--------|--------|-------------|--------|
| **A4** | **795 × 1123** | 210 × 297 | 8.27 × 11.69 |
| **US Letter** | **815 × 1056** | 216 × 279 | 8.5 × 11 |
| A3 | 1123 × 1588 | 297 × 420 | 11.69 × 16.54 |
| A5 | 560 × 795 | 148 × 210 | 5.83 × 8.27 |
| A6 | 397 × 560 | 105 × 148 | 4.13 × 5.83 |

## 🎯 Recommended Specifications for Your LTC Insurance Template

### A4 Format (Recommended)
- **Total Page Size:** 795 × 1123 pixels
- **Recommended Margins:** 40px left/right, 28px top, 70px bottom
- **Usable Content Area:** ~715px wide × ~1025px tall
- **Header Height:** ~50-60px
- **Footer Height:** ~60-70px
- **Content Space:** ~900px

### US Letter Format (Alternative)
- **Total Page Size:** 815 × 1056 pixels
- **Recommended Margins:** 40px left/right, 28px top, 70px bottom
- **Usable Content Area:** ~735px wide × ~958px tall
- **Header Height:** ~50-60px
- **Footer Height:** ~60-70px
- **Content Space:** ~830px

## ⚙️ Critical CSS Rules for PDF Monkey

### 1. Page Container
```css
.page {
  width: 795px;           /* A4 width */
  height: 1123px;         /* A4 height */
  overflow: hidden;       /* Prevent content overflow */
  position: relative;     /* Allow absolute positioning */
  margin: 0;
  padding: 28px 40px 70px; /* Top Right Bottom Left */
}
```

### 2. Page Breaks
```css
.page-break {
  page-break-before: always;
}

.page-break-after {
  page-break-after: always;
}

.avoid-break {
  page-break-inside: avoid;
}
```

### 3. Full-Page Background
```css
.page-with-bg {
  background-image: url("image-url");
  background-size: cover;
  background-position: center;
}
```

### 4. Header/Footer Positioning
```css
.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  width: 100%;
}

.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  width: 100%;
}
```

## 📋 Spacing Guidelines for 18-Page Document

To fit all content across 18 pages efficiently:

| Element | Recommended Size |
|---------|------------------|
| Page margins (all) | 40px |
| Section title margin | 10-12px |
| Heading (h3) margin | 8-10px |
| Paragraph margin | 3-6px |
| Table margin | 6-9px |
| Box padding | 10-12px |
| Box margin | 8-10px |
| Line height | 1.2-1.4 |
| Font size (body) | 11-12px |
| Font size (heading) | 14-16px |

## ✅ Best Practices

1. **Always use pixels** - Don't mix units (px, em, %)
2. **Set explicit heights** - Helps with page break calculations
3. **Use overflow: hidden** - Prevents content from exceeding page bounds
4. **Test with sample data** - Use PDF Monkey preview before generating
5. **Avoid large images** - They can cause unexpected page breaks
6. **Use page-break-inside: avoid** - For elements that should stay together
7. **Set margins in settings** - Not in CSS for better control
8. **Keep content within bounds** - Leave 40px margin on all sides minimum

## 🚀 Implementation Checklist

- [ ] Set template page size to A4 (795 × 1123px)
- [ ] Add margins: 40px left/right, 28px top, 70px bottom
- [ ] Set page overflow: hidden
- [ ] Position header/footer absolutely
- [ ] Use page-break-before/after for multi-page sections
- [ ] Test each page in preview
- [ ] Verify all content fits without scrolling
- [ ] Check header/footer appear on all pages
- [ ] Test with actual user data
- [ ] Generate sample PDF to verify output

## 📞 PDF Monkey Resources

- **Documentation:** https://pdfmonkey.io/docs/
- **Page Layout Guide:** https://pdfmonkey.io/docs/code-templates/page-layout/
- **API Reference:** https://pdfmonkey.io/docs/api/
- **Support:** support@pdfmonkey.io
