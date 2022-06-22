import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export const createOAI = (prefix: string, options: pulumi.CustomResourceOptions): aws.cloudfront.OriginAccessIdentity => {
  return new aws.cloudfront.OriginAccessIdentity(
    `${prefix}-oai`,
    {comment: 'OAI to connect to static website on S3 origin.'},
    options,
  );
};
