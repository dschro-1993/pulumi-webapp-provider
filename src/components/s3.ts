import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import {Asset} from './types';

const _publicReadPolicy = (bucketName: string, iamArn: string): string => {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid:      'PublicRead',
        Effect:   'Allow',
        Action:   ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
        Principal: {
          AWS: iamArn,
        },
      },
    ],
  });
};

const mimeTypesss = require('mime-types');

const _createAssets = (prefix: string, bucket: aws.s3.Bucket, assets: Asset[], options: pulumi.CustomResourceOptions): void => {
  for (const asset of assets) {
    const contentType = mimeTypesss.lookup(asset.path);
    new aws.s3.BucketObject(
      `${prefix}-${asset.name}`,
      {
        source: new pulumi.asset.FileAsset(asset.path),
        key:    asset.name,
        contentType,
        bucket,
      },
      options,
    );
  }
};

const _attachPolicy = (prefix: string, bucket: aws.s3.Bucket, iamArn: pulumi.Output<string>, options: pulumi.CustomResourceOptions): void => {
  new aws.s3.BucketPolicy(
    `${prefix}-bucket-policy`,
    {
      policy: pulumi.all([bucket.bucket, iamArn]).apply(([bucketName, iamArn]) => _publicReadPolicy(bucketName, iamArn)),
      bucket: bucket.bucket,
    },
    options,
  );
};

const _createBucket = (prefix: string, options: pulumi.CustomResourceOptions): aws.s3.Bucket => {
  return new aws.s3.Bucket(
    `${prefix}-bucket`,
    {
      bucket:  `${prefix}-bucket`,
      website: {indexDocument: 'index.html'},
    },
    options,
  );
};

export const createBucket = (prefix: string, oai: aws.cloudfront.OriginAccessIdentity, assets: Asset[], options: pulumi.CustomResourceOptions): aws.s3.Bucket => {
  const bucket = _createBucket(prefix, options);
  const childOptions: pulumi.CustomResourceOptions = {...options, parent: bucket};
  const iamArn = oai.iamArn;
  _attachPolicy(prefix, bucket, iamArn, childOptions);
  _createAssets(prefix, bucket, assets, childOptions);
  return bucket;
};
