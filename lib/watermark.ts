import sharp from "sharp";

interface WatermarkOptions {
  text: string;
  opacity?: number;
  fontSize?: number;
}

/**
 * Applies a diagonal repeating text watermark across the entire image.
 * The watermark uses the brand name rendered as semi-transparent white text
 * with a subtle shadow for visibility on both light and dark images.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions
): Promise<Buffer> {
  const { text, opacity = 0.3, fontSize = 48 } = options;

  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 800;

  const diagonal = Math.ceil(Math.sqrt(width * width + height * height));
  const svgWidth = diagonal;
  const svgHeight = diagonal;

  const lineHeight = fontSize * 3;
  const charWidth = fontSize * 0.6;
  const textWidth = text.length * charWidth;
  const spacingX = textWidth + fontSize * 4;
  const spacingY = lineHeight;
  const rows = Math.ceil(svgHeight / spacingY) + 2;
  const cols = Math.ceil(svgWidth / spacingX) + 2;

  let textElements = "";
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const x = col * spacingX;
      const y = row * spacingY;
      textElements += `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" fill-opacity="${opacity}" text-anchor="middle">${escapeXml(text)}</text>`;
    }
  }

  const offsetX = Math.round((diagonal - width) / 2);
  const offsetY = Math.round((diagonal - height) / 2);

  const svgOverlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="black" flood-opacity="0.5"/>
        </filter>
      </defs>
      <g filter="url(#shadow)" transform="translate(${width / 2}, ${height / 2}) rotate(-30) translate(${-svgWidth / 2 + offsetX}, ${-svgHeight / 2 + offsetY})">
        ${textElements}
      </g>
    </svg>`
  );

  return sharp(imageBuffer)
    .composite([
      {
        input: svgOverlay,
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
