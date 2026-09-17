import { uploadFile,getSignedDownloadUrl } from './storage.service';

console.log('test begin');
//await uploadFile("test.txt", Buffer.from("hello"), "text/plain");
//console.log('upload completed');
const url = await getSignedDownloadUrl('test.txt',3600);
console.log(`successfully fetched url: ${url}`);