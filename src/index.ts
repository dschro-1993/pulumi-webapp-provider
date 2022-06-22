import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import { Asset } from './components/types';

import { createOAI } from './components/oai';
import { createBucket } from './components/s3';
import { createDomain } from './components/cf';

import {sync} from 'fast-glob';
import {join} from 'path';

export interface ContentArgs {
  // Where to find webapp's production build ...
  pathToContent: string;
}

/**
 * Creates static website using S3, OAI and CloudFront
 */
export class StaticWebsite extends pulumi.ComponentResource  {
  bucket: aws.s3.Bucket;
  domain: aws.cloudfront.Distribution;

  // Question 1: Allow to customize bucket and domain?
  // Question 2: Allow to pass tags?
  constructor(name: string, args: ContentArgs, options?: pulumi.ResourceOptions) {
    super('StaticWebsite', name, {}, options);

    const defaultResourceOptions: pulumi.ResourceOptions = {parent: this};

    const rootPath = join(process.cwd(), args.pathToContent);
    // Todo: Check if path exists && if it is a directory ...
    const build = sync(`${rootPath}/**/*`);
    const assets: Asset[] = build.map((asset) => ({name: asset.replace(`${rootPath}/`, ''), path: asset}));
    // console.debug(JSON.stringify(assets));

    const oai = createOAI(name, defaultResourceOptions);
    const bucket = createBucket(name, oai.iamArn, assets, defaultResourceOptions);
    const domain = createDomain(name, oai.iamArn, bucket, defaultResourceOptions);

    this.bucket = bucket;
    this.domain = domain;
  }
}
