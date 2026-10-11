import sharp from 'sharp';

export async function processImageToAscii(file: Buffer<ArrayBuffer>

): Promise <{ imageResult: Buffer, asciiResult: Buffer}> {
    const imageResult: Buffer = Buffer.alloc(0);   // placeholder
    const asciiResult: Buffer = Buffer.from('');   // placeholder
    return { imageResult, asciiResult };
};