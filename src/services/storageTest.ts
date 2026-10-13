import { uploadFile, getFile, getSignedDownloadUrl, deleteFile } from './storage.service';

console.log('test begin');
await uploadFile("test.txt", Buffer.from("hello motherfucker"), "text/plain");
console.log('upload completed');
const url = await getSignedDownloadUrl('test.txt',3600);
console.log(`successfully fetched url: ${url}\n`);
const file = await getFile('test.txt');
console.log(`get file successfully. file content: ${file}`)
await deleteFile('test.txt');
console.log(`successfully deleted ${url}`);