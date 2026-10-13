import sharp from 'sharp';

export async function processImageToAscii(file: Buffer<ArrayBuffer>
): Promise<{ imageResult: Buffer, asciiResult: Buffer }> {

    const cols = 100;
    const charAspect = 0.55;    // tune to taste (width/height)
    const fontSize = 16;
    const cellW = fontSize * 0.6;            // monospace advance ≈ 0.6em
    const cellH = cellW / charAspect;

    const { width, height } = await sharp(file).metadata();
    const rows = Math.round((height / width) * cols * charAspect);
    const { data, info } = await sharp(file)
        .removeAlpha()
        .resize(cols, rows, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });
    // data is now a flat RGB buffer, one pixel per character cell

    const ramp = '.:-=+*#%@'; //dark -> light
    const charFor = (luma: number) => {
        return ramp[Math.floor((luma / 255) * (ramp.length - 1))];
    }
    const esc = (c: string) =>
        c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // for each pixel, compute `luma = 0.299r + 0.587g + 0.114b`, get the char, 
    // and stash { char, r, g, b } per cell.

    const svgWidth = Math.ceil(cols * cellW);
    const svgHeight = Math.ceil(rows * cellH);

    let text = '';
    let body = '';

    for (let row = 0; row < rows; row++) {
        let spans = '';
        for (let col = 0; col < cols; col++) {
            const i = (row * cols + col) * info.channels;
            const r = data[i] ?? 0;
            const g = data[i + 1] ?? 0;
            const b = data[i + 2] ?? 0;
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            const char = charFor(luma) ?? '';
            text += char;
            spans +=
                `<tspan x="${(col * cellW).toFixed(2)}" fill="rgb(${r},${g},${b})">
                ${esc(char)}
                </tspan>`;
        }
        text += '\n';
        body += `<text y="${((row + 0.8) * cellH).toFixed(2)}">${spans}</text>`;
    }

    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">` +
        `<rect width="100%" height="100%" fill="#000"/>` +
        `<g font-family="DejaVu Sans Mono, Menlo, Consolas, monospace" font-size="${fontSize}">` +
        body +
        `</g></svg>`;

    // let html = '';
    // for (let i = 0; i < data.length; i += 3) {
    //     let r = data[i] ?? 0;
    //     let g = data[i + 1] ?? 0;
    //     let b = data[i + 2] ?? 0;
    //     let { char, red, green, blue } = 
    //     { char: charFor(0.299 * r + 0.587 * g + 0.114 * b), red: r, green: g, blue: b };
    //     html+= `<span style="color: rgb(${red},${green},${blue})">${char}</span>`;
    // }

    const imageResult: Buffer = await sharp(Buffer.from(svg, 'utf-8'),{ density: 200 }).png().toBuffer();
    const asciiResult: Buffer = Buffer.from(text, 'utf-8');  
    return { imageResult, asciiResult };
}

