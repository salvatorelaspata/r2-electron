const {
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl: signUrl } = require('@aws-sdk/s3-request-presigner');
const { clientS3 } = require("./clientS3.js");
const { sizeToHumanReadable } = require("./util.js");

const createBucket = async (name) => {
  const response = await clientS3.send(new CreateBucketCommand({ Bucket: name }));
  return response;
}

const _deleteBucket = async (name) => {
  const response = await clientS3.send(new DeleteBucketCommand({ Bucket: name }));
  return response;
}

const deleteEmptyBucket = async (name) => {
  const objects = await listObjects(name);
  if (objects && objects.length > 0) {
    throw new Error("Bucket is not empty");
  }
  const response = await _deleteBucket(name);
  return response;
}

const listBuckets = async () => {
  const response = await clientS3.send(new ListBucketsCommand({}));
  return response.Buckets;
}

const listObjects = async (Bucket) => {
  const response = await clientS3.send(new ListObjectsV2Command({ Bucket }));
  return response.Contents;
}

const getObject = async (Bucket, Key) => {
  const response = await clientS3.send(new GetObjectCommand({ Bucket, Key }));
  return response.Body;
}

const putObject = async (Bucket, Key, Body) => {
  const response = await clientS3.send(new PutObjectCommand({ Bucket, Key, Body }));
  return response;
}

const getSignedUrl = async (Bucket, Key) => {
  const signedUrl = await signUrl(clientS3, new GetObjectCommand({ Bucket, Key }));
  return signedUrl;
}

const deleteObject = async (Bucket, Key) => {
  const response = await clientS3.send(new DeleteObjectCommand({ Bucket, Key }));
  return response;
}

const getBucketStats = async (bucketName) => {
  const objects = await listObjects(bucketName);
  if (!objects) return null;

  const totalSize = objects.reduce((acc, obj) => acc + obj.Size, 0);

  return {
    totalObjects: objects.length,
    totalSize: totalSize,
    humanReadableSize: sizeToHumanReadable(totalSize),
    objects: objects.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      humanReadableSize: sizeToHumanReadable(obj.Size)
    }))
  };
}

const createFolder = async (Bucket, FolderName) => {
  const response = await clientS3.send(new PutObjectCommand({
    Bucket,
    Key: `${FolderName}`
  }));
  return response;
};

module.exports = {
  createBucket,
  deleteEmptyBucket,
  listBuckets,
  listObjects,
  getObject,
  putObject,
  getSignedUrl,
  deleteObject,
  getBucketStats,
  createFolder // Add the new function to the exports
};