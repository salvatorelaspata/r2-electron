const chalk = require("chalk");

const _sizeUnit = (size) => {
  return {
    bytes: size,
    kb: size / 1024,
    mb: size / 1024 / 1024,
    gb: size / 1024 / 1024 / 1024
  }
}
const sizeToHumanReadable = (size, full) => {
  const { bytes, kb, mb, gb } = _sizeUnit(size);
  if (full) return `${bytes} bytes; ${kb.toFixed(2)} KB; ${mb.toFixed(2)} MB; ${gb.toFixed(2)} GB`;
  // return the size in the most appropriate unit
  if (size < 1024) return `${size} bytes`; // < 1 KB
  else if (size < 1024 * 1024) return `${kb.toFixed(2)} KB`; // < 1 MB
  else if (size < 1024 * 1024 * 1024) return `${mb.toFixed(2)} MB`; // < 1 GB
  else return `${gb.toFixed(2)} GB`;
}

const manipolatedObjects = (objects) => objects.map(obj => ({
  bucket: obj.bucket,
  Key: obj.Key, 
  LastModified: obj.LastModified,
  Size: sizeToHumanReadable(obj.Size)
}))

const totalSize = (objects) => objects.reduce((acc, obj) => acc + obj.Size, 0);

const printObjects = (objects) => {
    console.table(manipolatedObjects(objects));
    const size = objects.reduce((acc, obj) => acc + obj.Size, 0);
    console.log(`Total size: ${sizeToHumanReadable(size, true)}`);
}

const objectToChoices = (bucket, obj) => {
  return { 
    name: `[${bucket}] ${obj.Key} (${sizeToHumanReadable(obj.Size)})`, 
    value: {
      key: obj.Key, 
      bucket: bucket, 
      size: sizeToHumanReadable(obj.Size)
    } 
  }
};

const log = {
  info: (msg) => console.log(chalk.blue(`[INFO] ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`[WARNING] ${msg}`)),
  success: (msg) => console.log(chalk.green(`[SUCCESS] ${msg}`)),
  error: (msg) => console.log(chalk.red(`[ERROR] ${msg}`)),
}

module.exports = {
  sizeToHumanReadable,
  manipolatedObjects,
  totalSize,
  printObjects,
  objectToChoices,
  log
}