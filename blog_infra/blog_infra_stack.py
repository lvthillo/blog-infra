from aws_cdk import core as cdk

# For consistency with other languages, `cdk` is the preferred import name for
# the CDK's core module.  The following line also imports it as `core` for use
# with examples from the CDK Developer's Guide, which are in the process of
# being updated to use `cdk`.  You may delete this import if you don't need it.
from aws_cdk import core
from blog_infra.static_stack import StaticStack


class BlogInfraStack(cdk.Stack):

    def __init__(self, scope, construct_id, props, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        site = StaticStack(
            self,
            f"{props['namespace']}-construct",
            site_bucket_name=props["bucket_name"],
            domain_name=props["domain_name"],
            #hosted_zone_id=props["hosted_zone_id"],
            #hosted_zone_name=props["hosted_zone_name"],
        )

        # Add stack outputs
        cdk.CfnOutput(
            self,
            "SiteBucketName",
            value=site.bucket.bucket_name,
        )
        #cdk.CfnOutput(
        #    self,
        #    "DistributionId",
        #    value=site.distribution.distribution_id,
        #)
