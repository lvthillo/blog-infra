#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BlogInfraStack } from '../lib/blog-infra-stack';

class MyBlogInfraStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
      super(parent, name, props);

      new BlogInfraStack(this, 'BlogSite', {
          domainName: this.node.tryGetContext('domain'),
      });
  }
}

const app = new cdk.App();
new MyBlogInfraStack(app, 'BlogInfraStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});