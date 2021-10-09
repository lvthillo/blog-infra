#!/usr/bin/env python3
import os

from aws_cdk import core as cdk
from aws_cdk import core

from blog_infra.blog_infra_stack import BlogInfraStack


app = core.App()

props = {
    "namespace": "blog",
    "bucket_name": app.node.try_get_context("bucket_name"),
    "domain_name": app.node.try_get_context("domain_name"),
}

env = cdk.Environment(
    account=os.environ["CDK_DEFAULT_ACCOUNT"],
    region=os.environ["CDK_DEFAULT_REGION"]
)

BlogInfra = BlogInfraStack(
    scope=app,
    construct_id=f"{props['namespace']}-stack",
    props=props,
    env=env,
    description="static site using S3, CloudFront and Route53",
)

app.synth()
