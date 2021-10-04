from aws_cdk import (
    core as cdk,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_certificatemanager as acm,
    aws_route53 as route53,
    aws_route53_targets as targets,
)

class StaticStack(cdk.Construct):
    def __init__(
        self,
        scope,
        construct_id,
        domain_name,
        #hosted_zone_id,
        #hosted_zone_name,
        site_bucket_name=None,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Instance variables
        self.__site_bucket_name = site_bucket_name
        self.__domain_name = domain_name
        #self.__hosted_zone_id = hosted_zone_id
        #self.__hosted_zone_name = hosted_zone_name

        # Public variables
        self.bucket = None
        self.certificate = None
        #self.distribution = None

        # Create the S3 bucket for the site contents
        self.__create_site_bucket()

        # Create CloudFront function to set security headers
        security_headers = self.__create_cloudfront_function()

        # Get the hosted zone based on the provided domain name
        hosted_zone = self.__get_hosted_zone()

        # Get an existing or create a new certificate for the site domain
        self.__create_certificate(hosted_zone)

        # Create the cloud front distribution
        self.__create_cloudfront_distribution(security_headers)

        # Create a Route53 record
        self.__create_route53_record(hosted_zone)

    def __create_site_bucket(self):
        """Create the S3 bucket for the static site construct
        It creates a secure s3 bucket (blocked public access).
        """

        self.bucket = s3.Bucket(
            self,
            "site_bucket",
            bucket_name=self.__site_bucket_name,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.RETAIN,
            auto_delete_objects=False,
        )

    def __create_cloudfront_distribution(self, security_headers):
        """Create a cloudfront distribution with site bucket as the origin"""

        self.distribution = cloudfront.Distribution(
            self,
            "cloudfront_distribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(self.bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                function_associations=[
                    cloudfront.FunctionAssociation(
                        event_type=cloudfront.FunctionEventType.VIEWER_RESPONSE,
                        function=security_headers,
                    )
                ]
            ),
            domain_names=[self.__domain_name],
            certificate=self.certificate,
            default_root_object="index.html",
        )

    def __create_cloudfront_function(self):
        """todo"""
        security_headers = cloudfront.Function(
            self,
            "security_headers",
            code=cloudfront.FunctionCode.from_file(
                file_path="lambda/headers.js",
            ),
        )
        return security_headers

    def __get_hosted_zone(self):
        return route53.HostedZone.from_lookup(
            self, "hosted_zone", domain_name=self.__domain_name
        )

    def __create_route53_record(self, hosted_zone):
        route53.ARecord(
            self,
            "site-alias-record",
            record_name=self.__domain_name,
            zone=hosted_zone,
            target=route53.RecordTarget.from_alias(
                targets.CloudFrontTarget(self.distribution)
            ),
        )

    def __create_certificate(self, hosted_zone):
        self.certificate = acm.DnsValidatedCertificate(self, 'CrossRegionCertificate',
            domain_name=self.__domain_name,
            hosted_zone=hosted_zone,
            region='us-east-1',
        )