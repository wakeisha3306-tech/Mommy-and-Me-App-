import { APP_NAME, SHARE_CARD_TAGLINE } from "@/lib/brand";

export interface ShareCardContent {
  text: string;
  label: string;
  tagline?: string;
  closingLine?: string;
  senderLine?: string;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxLineLength: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLineLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 7);
}

function buildSvgMarkup(content: ShareCardContent) {
  const lines = wrapText(content.text, 28);
  const textSpans = lines
    .map((line, index) => `<tspan x="72" dy="${index === 0 ? 0 : 42}">${escapeXml(line)}</tspan>`)
    .join("");
  const closingLine = content.closingLine ?? "A little moment for you";
  const senderLine = content.senderLine ?? "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#fff6ef" />
          <stop offset="48%" stop-color="#f8e5ea" />
          <stop offset="100%" stop-color="#ede7f7" />
        </linearGradient>
        <radialGradient id="glowRose" cx="25%" cy="18%" r="60%">
          <stop offset="0%" stop-color="#f2b9c8" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#f2b9c8" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowGold" cx="80%" cy="85%" r="52%">
          <stop offset="0%" stop-color="#f4d7a5" stop-opacity="0.72" />
          <stop offset="100%" stop-color="#f4d7a5" stop-opacity="0" />
        </radialGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="18" stdDeviation="30" flood-color="#9d6e74" flood-opacity="0.18" />
        </filter>
      </defs>

      <rect width="1080" height="1350" fill="url(#bg)" rx="72" />
      <circle cx="210" cy="190" r="280" fill="url(#glowRose)" />
      <circle cx="885" cy="1100" r="250" fill="url(#glowGold)" />

      <rect x="58" y="58" width="964" height="1234" rx="48" fill="rgba(255,255,255,0.68)" />
      <g filter="url(#shadow)">
        <rect x="92" y="110" width="896" height="1124" rx="42" fill="rgba(255,255,255,0.82)" />
      </g>

      <text x="540" y="205" text-anchor="middle" font-size="32" letter-spacing="8" fill="#8d6570" font-family="Georgia, serif">
        ${escapeXml(APP_NAME.toUpperCase())}
      </text>
      <text x="540" y="260" text-anchor="middle" font-size="22" letter-spacing="3" fill="#b1838d" font-family="Arial, sans-serif">
        ${escapeXml(content.tagline ?? SHARE_CARD_TAGLINE)}
      </text>

      <rect x="380" y="314" width="320" height="48" rx="24" fill="rgba(205,142,159,0.12)" />
      <text x="540" y="346" text-anchor="middle" font-size="20" letter-spacing="4" fill="#9d6e74" font-family="Arial, sans-serif">
        ${escapeXml(content.label.toUpperCase())}
      </text>

      <text x="72" y="0" font-size="54" fill="#6f4e57" font-family="Georgia, serif">
        <tspan x="150" y="470">&#8220;</tspan>
      </text>
      <text x="72" y="540" font-size="46" fill="#5f474f" font-family="Georgia, serif">
        ${textSpans}
      </text>
      <text x="905" y="980" text-anchor="end" font-size="54" fill="#6f4e57" font-family="Georgia, serif">&#8221;</text>

      <text x="540" y="1106" text-anchor="middle" font-size="24" fill="#a07b84" font-family="Arial, sans-serif">
        ${escapeXml(closingLine)}
      </text>
      ${
        senderLine
          ? `<text x="540" y="1154" text-anchor="middle" font-size="20" fill="#b18a93" font-family="Arial, sans-serif">${escapeXml(senderLine)}</text>`
          : ""
      }
    </svg>
  `;
}

async function svgToPngBlob(svgMarkup: string) {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("The share image could not be created."));
      nextImage.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("This browser could not prepare the share image.");
    }

    context.drawImage(image, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (!nextBlob) {
          reject(new Error("The share image could not be downloaded."));
          return;
        }

        resolve(nextBlob);
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function createShareCardFile(content: ShareCardContent) {
  const pngBlob = await svgToPngBlob(buildSvgMarkup(content));
  return new File([pngBlob], "between-us-moment.png", { type: "image/png" });
}

export async function downloadShareCard(content: ShareCardContent) {
  const file = await createShareCardFile(content);
  const url = URL.createObjectURL(file);

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function shareShareCard(content: ShareCardContent) {
  const file = await createShareCardFile(content);

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({
      title: APP_NAME,
      text: content.tagline ?? SHARE_CARD_TAGLINE,
      files: [file],
    });
    return true;
  }

  return false;
}
