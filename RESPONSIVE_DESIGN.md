# Responsive Design Documentation

## Breakpoint Strategy

```css
Mobile:        < 480px
Tablet:        480px - 768px
Laptop:        768px - 1024px
Desktop:       > 1024px
```

## Component Responsive Behavior

### 1. SimulationControls
| Breakpoint | Layout | Notes |
|-----------|--------|-------|
| < 480px | Stack | Single column, speed buttons in row |
| 480-768px | Flex | Controls wrap at breakpoint |
| > 768px | Full | All controls on one row |

### 2. TripsGrid
| Breakpoint | Grid | Card Width |
|-----------|------|-----------|
| < 480px | 1 col | Full width - padding |
| 480-768px | 1-2 col | ~300px min |
| > 768px | 3+ cols | 350px min |

### 3. FleetOverview
| Breakpoint | Grid | Layout |
|-----------|------|--------|
| < 480px | 1 col | Stacked cards |
| 480-768px | 2 col | Compact grid |
| > 768px | 4+ col | Full grid |

## Mobile Optimization

### Touch Targets
- All buttons: minimum 44x44px
- Spacing: 0.75rem between interactive elements
- No hover states on mobile (use active states)

### Font Sizes
```
Mobile:  14px base
Tablet:  15px base
Desktop: 16px base
```

### Viewport Configuration
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

## Testing Checklist

### Desktop (1920x1080)
- [ ] All 5 trip cards visible
- [ ] Fleet overview shows 4-column grid
- [ ] Simulation controls fit on one line
- [ ] No horizontal scrolling

### Tablet (768x1024)
- [ ] Trip cards wrap to 2 columns
- [ ] Fleet overview shows 2-column grid
- [ ] Simulation controls wrap properly
- [ ] Touch targets adequate

### Mobile (375x667)
- [ ] Single column layout
- [ ] Touch buttons 44x44px minimum
- [ ] No horizontal scrolling
- [ ] Footer visible without scroll

## CSS Media Query Reference

```css
/* Mobile First Approach */
.container {
  grid-template-columns: 1fr; /* Mobile default */
}

/* Tablet and up */
@media (min-width: 480px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop and up */
@media (min-width: 768px) {
  .container {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large desktop */
@media (min-width: 1024px) {
  .container {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## Performance on Mobile

### Optimization Techniques
1. **Code Splitting**: Load only necessary components
2. **Image Optimization**: Use SVG icons instead of images
3. **Lazy Loading**: Load trip details on demand
4. **Throttling**: Reduce update frequency on slow devices
5. **Memory Management**: Clear old events periodically

### Mobile Performance Targets
- First Contentful Paint (FCP): < 2s
- Time to Interactive (TTI): < 3.5s
- Layout Shift (CLS): < 0.1

## Landscape vs Portrait

### Portrait (most common)
- Natural vertical scrolling
- Full width controls
- Stack everything vertically

### Landscape
- May show 2 trip cards side-by-side
- Adjust font sizes to prevent overflow
- Optimize vertical space usage

## Accessibility on Mobile

### Touch-Friendly
- Larger touch targets (44x44px)
- Adequate spacing between buttons
- No small text (< 12px)

### Screen Readers
- Semantic HTML
- ARIA labels
- Focus management

### Keyboard Navigation
- Tab order correct
- Focus visible
- Keyboard shortcuts working

## Common Issues & Solutions

### Issue: Layout breaks on mobile
**Solution**: Use max-width container, check media queries

### Issue: Text too small to read
**Solution**: Increase base font size, check viewport meta

### Issue: Buttons hard to tap
**Solution**: Increase padding, use min 44x44px targets

### Issue: Horizontal scrolling appears
**Solution**: Check for overflow hidden, review grid gaps

## Browser-Specific Notes

### iOS Safari
- `position: fixed` can be buggy
- Use `position: sticky` for headers
- Test with VoiceOver enabled

### Android Chrome
- Fast rendering
- Good media query support
- Test with TalkBack enabled

## Testing Tools

### DevTools
```
Chrome: Ctrl+Shift+M or F12 > Device Toolbar
Firefox: Ctrl+Shift+K > Responsive Design Mode
Safari: Develop > Enter Responsive Design Mode
```

### Real Device Testing
- Test on actual devices when possible
- Use BrowserStack or similar for multiple devices
- Test with real network conditions (throttling)

## Recommended Devices for Testing

### Phones
- iPhone 12 (390x844)
- iPhone SE (375x667)
- Android 12 (412x915)

### Tablets
- iPad Air (820x1180)
- iPad Mini (768x1024)

### Laptops
- 1366x768 (common)
- 1920x1080 (full HD)
- 2560x1440 (QHD)
