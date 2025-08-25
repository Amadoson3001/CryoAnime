# Live2D Waifu Component Setup Guide

## Overview

I've created a new, improved Live2D waifu component that replaces the old one. This component is more robust, configurable, and includes better error handling.

## How to Use the Component

### Basic Usage

```tsx
import Live2dWaifu from '@/components/live2d-waifu';

// Add to your layout or page
<Live2dWaifu />
```

### Advanced Configuration

```tsx
import Live2dWaifu from '@/components/live2d-waifu';

<Live2dWaifu
  settings={{
    model: {
      jsonPath: 'path/to/your/model.model.json',
      scale: 0.8,
      position: 'right',
      width: 200,
      height: 400,
      hOffset: 30,
      vOffset: 30
    },
    display: {
      position: 'right',
      width: 200,
      height: 400,
      hOffset: 30,
      vOffset: 30
    },
    mobile: {
      show: true,
      scale: 0.6
    },
    react: {
      opacityDefault: 0.8,
      opacityOnHover: 0.3
    },
    showToolMenu: false,
    showHitAreaFrames: false
  }}
  onLoad={() => console.log('Live2D loaded successfully')}
  onError={(error) => console.error('Live2D error:', error)}
/>
```

## How to Use Custom Live2D Models

### Step 1: Obtain a Live2D Model

There are several ways to get custom Live2D models:

#### Option A: Use Pre-made Models

You can find pre-made Live2D models from various sources:

- [Live2D Models Collection](https://github.com/xiaoski/live2d_models_collection)
- [Live2D Hub](https://www.live2d.com/en/)
- Various anime/game character models

#### Option B: Create Your Own Model

To create your own Live2D model, you'll need:

1. **Live2D Cubism Editor** (paid software)
2. Character artwork (PSD files)
3. Time and artistic skills

### Step 2: Prepare Your Model Files

A typical Live2D model consists of:

```
your-model/
├── your-model.model.json          # Main model configuration
├── your-model.model3.json         # Model3 format (if available)
├── textures/                      # Texture files
│   ├── texture_00.png
│   ├── texture_01.png
│   └── ...
├── motions/                       # Animation files
│   ├── idle.mtn
│   ├── tap.mtn
│   └── ...
├── physics.json                   # Physics configuration
├── pose.json                      # Pose configuration
└── expressions/                   # Expression files
    ├── expression_01.exp.json
    └── ...
```

### Step 3: Host Your Model Files

You need to host your model files online. Options include:

#### Option A: GitHub + jsDelivr (Recommended)

1. Create a public GitHub repository
2. Upload your model files to the repository
3. Use jsDelivr CDN URL format:

   ```
   https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@main/path/to/your-model.model.json
   ```

#### Option B: Your Own Server

- Host files on your own web server
- Ensure CORS is properly configured
- Use direct URLs to your model files

#### Option C: Vercel/Netlify Deployment

- Deploy your model files as static assets
- Use the deployment URL as the base path

### Step 4: Configure the Component

```tsx
<Live2dWaifu
  settings={{
    model: {
      jsonPath: 'https://cdn.jsdelivr.net/gh/yourusername/your-repo@main/models/waifu/waifu.model.json',
      scale: 0.8,
      position: 'right',
      width: 150,
      height: 300
    }
  }}
/>
```

## Popular Live2D Model Sources

### Koharu (Default Model)

```tsx
settings={{
  model: {
    jsonPath: 'https://cdn.jsdelivr.net/gh/xiaoski/live2d_models_collection/models/koharu/koharu.model.json'
  }
}}
```

### Hatsune Miku

```tsx
settings={{
  model: {
    jsonPath: 'https://cdn.jsdelivr.net/gh/xiaoski/live2d_models_collection/models/Hatsune_Miku/Hatsune_Miku.model.json'
  }
}}
```

### Shizuku

```tsx
settings={{
  model: {
    jsonPath: 'https://cdn.jsdelivr.net/gh/xiaoski/live2d_models_collection/models/shizuku/shizuku.model.json'
  }
}}
```

## Troubleshooting

### Common Issues

1. **Model not loading**
   - Check if the model.json URL is accessible
   - Verify CORS settings if using custom hosting
   - Ensure all model files are in the correct relative paths

2. **Model appears distorted**
   - Adjust the `scale` property
   - Check `width` and `height` settings
   - Modify `hOffset` and `vOffset` for positioning

3. **Mobile display issues**
   - Configure the `mobile` settings
   - Set appropriate `scale` for mobile devices

4. **Performance issues**
   - Reduce model complexity if possible
   - Lower the `scale` value
   - Disable unnecessary features

### Debug Mode

Enable debug mode by setting `showHitAreaFrames: true` in settings to see interaction areas.

## Component Props Reference

### Live2dWaifuProps

- `settings?: Partial<Live2DSettings>` - Configuration object
- `onLoad?: () => void` - Called when model loads successfully
- `onError?: (error: Error) => void` - Called when an error occurs

### Live2DSettings

- `model: Live2DModel` - Model configuration (required)
- `display?: DisplaySettings` - Display settings
- `mobile?: MobileSettings` - Mobile-specific settings
- `react?: ReactSettings` - Interaction settings
- `tips?: TipsSettings` - Text tip settings
- `showToolMenu?: boolean` - Show developer tools
- `showHitAreaFrames?: boolean` - Show hit areas for debugging

## Integration with Your App

### Add to Layout

```tsx
// app/layout.tsx
import Live2dWaifu from '@/components/live2d-waifu';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Live2dWaifu />
      </body>
    </html>
  );
}
```

### Conditional Loading

```tsx
// Only show on specific pages
'use client';
import { usePathname } from 'next/navigation';
import Live2dWaifu from '@/components/live2d-waifu';

export default function ConditionalWaifu() {
  const pathname = usePathname();
  const showWaifu = !pathname.includes('/admin'); // Hide on admin pages

  return showWaifu ? <Live2dWaifu /> : null;
}
```

## Security Considerations

- Only load models from trusted sources
- Be aware that external scripts are loaded
- Consider user privacy implications
- Test thoroughly before deploying to production

## Performance Tips

1. Use appropriate model sizes
2. Consider lazy loading for better performance
3. Cache model files when possible
4. Monitor memory usage with complex models

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify model file paths and accessibility
3. Test with the default model to isolate issues
4. Ensure your hosting supports CORS if needed
