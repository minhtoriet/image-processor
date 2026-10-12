import sharp from 'sharp';

export async function processImageToAscii(file: Buffer<ArrayBuffer>

): Promise<{ imageResult: Buffer, asciiResult: Buffer }> {
    const cols = 100;
    const charAspect = 0.55; // tune to taste
    const { width, height } = await sharp(file).metadata();
    const rows = Math.round((height / width) * cols * charAspect);
    const { data } = await sharp(file)
        .resize(cols, rows, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });
    // data is now a flat RGB buffer, one pixel per character cell

    const ramp = '.:-=+*#%@'; //dark -> light
    const charFor = (luma: number) => {
        const idx = Math.floor((luma / 255) * (ramp.length - 1));
        return ramp[idx];
    }
    // for each pixel, compute `luma = 0.299r + 0.587g + 0.114b`, get the char, 
    // and stash { char, r, g, b } per cell.

    


    
    const imageResult: Buffer = Buffer.alloc(0);   // placeholder
    const asciiResult: Buffer = Buffer.from('');   // placeholder
    return { imageResult, asciiResult };
}

