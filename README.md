# HueShift

A browser-based color parser and replacement tool for developers and designers. Parse, visualize, and replace colors in your code instantly.

## Features

- **Multi-format Color Detection**: Automatically detects hex (#fff, #ffffff), RGB/RGBA, HSL/HSLA, and named colors
- **Visual Color Gallery**: See all detected colors with their format and usage count
- **Interactive Color Replacement**: Replace colors using a visual picker or manual input
- **Replacement Modes**:
  - Replace all instances of a color
  - Selectively replace specific instances
- **WCAG Contrast Checker**: Check accessibility compliance with AA/AAA badges
- **Before/After Palette Comparison**: Compare original and modified color palettes
- **Auto-parsing**: Colors are detected as you type (debounced)
- **Copy/Export**: Copy modified text or download as a file
- **Format Preservation**: Replacements maintain the original color format when possible

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Color Libraries**:
  - react-colorful (color picker)
  - tinycolor2 (color manipulation and validation)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hueshift.git
cd hueshift
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Paste your code**: Paste any text containing color values (CSS, HTML, SVG, etc.)
2. **View detected colors**: All colors are automatically parsed and displayed in the gallery
3. **Select a color to replace**: Click on any color card
4. **Choose replacement**: Use the color picker or enter a value manually
5. **Select mode**: Choose "Replace All" or "Selective" replacement
6. **Apply changes**: Click "Apply Replacement"
7. **Export**: Copy or download your modified code

## Deployment

### Deploy to Vercel

The easiest way to deploy HueShift is to use Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/hueshift)

Or manually:

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build
4. Deploy!

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
hueshift/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── color-parser.tsx  # Main color parser component
│   └── header.tsx        # Header component
├── lib/                   # Utility functions
│   ├── color-parser.ts   # Color parsing logic
│   ├── utils.ts          # General utilities
│   └── hooks/            # Custom React hooks
│       └── use-debounce.ts
└── public/               # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Roadmap

- [ ] Account-based project saving
- [ ] AI-powered palette suggestions
- [ ] Advanced accessibility auditing
- [ ] Color harmony suggestions
- [ ] Batch file processing
- [ ] Browser extension

## Author

Built by Colin - [colinrodrigues.com](https://colinrodrigues.com)

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [react-colorful](https://github.com/omgovich/react-colorful) for the color picker
- [TinyColor](https://github.com/bgrins/TinyColor) for color manipulation
