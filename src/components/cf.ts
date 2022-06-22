import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const _createResponseHeadersPolicy = (prefix: string, options: pulumi.CustomResourceOptions): aws.cloudfront.ResponseHeadersPolicy => {
  return new aws.cloudfront.ResponseHeadersPolicy(
    `${prefix}-response-headers-policy`,
    {
      securityHeadersConfig: {
        contentSecurityPolicy: {override: true, contentSecurityPolicy: `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'`},
        // Add other policies depending on your use case ...
      },
    },
    options,
  );
};

export const createDomain = (prefix: string, oai: aws.cloudfront.OriginAccessIdentity, bucket: aws.s3.Bucket, options: pulumi.CustomResourceOptions): aws.cloudfront.Distribution => {
  const policy = _createResponseHeadersPolicy(prefix, options);
  return new aws.cloudfront.Distribution(
    `${prefix}-distribution`,
    {
      origins: [
        {
          domainName: bucket.bucketRegionalDomainName,
          originId:   bucket.bucket,
          s3OriginConfig: {
            originAccessIdentity: oai.cloudfrontAccessIdentityPath,
          },
        },
      ],
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      defaultRootObject: 'index.html',
      defaultCacheBehavior: {
        compress: true,
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods:  ['GET', 'HEAD', 'OPTIONS'],
        targetOriginId: bucket.bucket,
        // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html
        // originRequestPolicyId: '216adef6-5c7f-47e4-b989-5492eafa07d3',
        // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
        cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
        responseHeadersPolicyId: policy.id,
      },
      waitForDeployment: true,
      enabled: true,
    },
    options,
  );
};
