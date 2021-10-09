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
        site_bucket_name=None,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Instance variables
        self.__site_bucket_name = site_bucket_name
        self.__domain_name = domain_name
        self.__www_domain_name = 'www.%s' % self.__domain_name

        # Public variables
        self.bucket = None
        self.certificate = None

        # Create the S3 bucket for the site contents
        self.__create_site_bucket()

        # Create CloudFront function to set security headers + redirect www
        security_headers = self.__create_cloudfront_function_security_headers()
        redirect = self.__create_cloudfront_function_redirect()

        # Get the hosted zone based on the provided domain name
        hosted_zone = self.__get_hosted_zone()

        # Get an existing or create a new certificate for the site domain
        self.__create_certificate(hosted_zone)

        # Create the cloud front distribution
        self.__create_cloudfront_distribution(security_headers, redirect)

        # Create a Route53 alias record
        self.__create_route53_a_record(hosted_zone)

        # Create CNAME which depends on alias record
        self.__create_route53_cname_record(hosted_zone)


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

    def __create_cloudfront_distribution(self, security_headers, redirect):
        """Create a cloudfront distribution with site bucket as the origin
        Attach CloudFront functions to distribution
        Attach SSL/TLS certificate to distribution
        Configure domain names for distribution
        """
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
                    ),
                    cloudfront.FunctionAssociation(
                        event_type=cloudfront.FunctionEventType.VIEWER_REQUEST,
                        function=redirect,
                    )
                ]
            ),
            domain_names=[self.__domain_name,self.__www_domain_name],
            certificate=self.certificate,
            default_root_object="index.html",
        )

    def __create_cloudfront_function_security_headers(self):
        """Set security headers"""
        security_headers = cloudfront.Function(
            self,
            "security_headers",
            code=cloudfront.FunctionCode.from_file(
                file_path="lambda/headers.js",
            ),
        )
        return security_headers

    def __create_cloudfront_function_redirect(self):
        """Redirect www to non-www domain"""
        redirect = cloudfront.Function(
            self,
            "redirect",
            code=cloudfront.FunctionCode.from_file(
                file_path="lambda/redirect.js",
            ),
        )
        return redirect

    def __get_hosted_zone(self):
        """Get Hosted zone"""
        return route53.HostedZone.from_lookup(
            self, "hosted_zone", domain_name=self.__domain_name
        )

    def __create_route53_a_record(self, hosted_zone):
        """Create Route53 Alias record to CloudFront"""
        a = route53.ARecord(
            self,
            "site-alias-record",
            record_name=self.__domain_name,
            zone=hosted_zone,
            target=route53.RecordTarget.from_alias(
                targets.CloudFrontTarget(self.distribution)
            ),
        )
        return a 

    def __create_route53_cname_record(self, hosted_zone):
        """Create Route53 www CNAME record to domain"""
        route53.CnameRecord(
            self,
            "site-cname-www-record",
            domain_name=self.__domain_name,
            zone=hosted_zone,
            record_name=self.__www_domain_name
            #record_name=self.__www_domain_name,
            #zone=hosted_zone,
            #target=route53.RecordTarget.from_alias(targets.Route53RecordTarget(b))
        )

    def __create_certificate(self, hosted_zone):
        """Create ACM certificate used by CloudFront in us-east-1"""
        self.certificate = acm.DnsValidatedCertificate(self, 'CrossRegionCertificate',
            domain_name=self.__domain_name,
            subject_alternative_names=[self.__domain_name, self.__www_domain_name],
            hosted_zone=hosted_zone,
            region='us-east-1',
        )