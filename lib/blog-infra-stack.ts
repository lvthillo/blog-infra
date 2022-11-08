import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins'
import { CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface BlogSiteProps {
  domainName: string
}

export class BlogInfraStack extends Construct {
  constructor(scope: Construct, id: string, props: BlogSiteProps) {
    super(scope, id)

    const domainName = props.domainName
    const fullDomainName = 'www.' + props.domainName

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: 'lvthillo.com', //domainName,
    })

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      'cloudfront-OAI',
      {
        comment: `OAI for ${props.domainName}`,
      }
    )

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: props.domainName,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    })

    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [siteBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    )

    const certificate = new acm.DnsValidatedCertificate(
      this,
      'SiteCertificate',
      {
        domainName: domainName,
        subjectAlternativeNames: [fullDomainName],
        hostedZone: zone,
        region: 'us-east-1', // Cloudfront
      }
    )

    const redirectFileCodeOptions: cloudfront.FileCodeOptions = {
      filePath: 'lambda/redirect.js',
    }

    const redirectLambda = new cloudfront.Function(this, 'redirect', {
      code: cloudfront.FunctionCode.fromFile(redirectFileCodeOptions),
    })

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'ResponseHeadersPolicy',
      {
        responseHeadersPolicyName: 'CustomSecurityHeadersPolicy',
        comment: 'Custo Security Headers policy',
        securityHeadersBehavior: {
          contentSecurityPolicy: {
            contentSecurityPolicy:
             //"default-src 'none'; img-src 'self' https://www.google-analytics.com; script-src 'self' 'unsafe-inline' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; object-src 'none'; connect-src https://www.google-analytics.com; form-action 'self'",
              "default-src 'none'; script-src 'self' https://*.googletagmanager.com 'unsafe-inline'; img-src 'self' https://*.google-analytics.com https://*.googletagmanager.com; connect-src https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; object-src 'none'; form-action 'self'",
              override: true,
          },
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: {
            referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER,
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: Duration.seconds(15768000),
            includeSubdomains: true,
            override: true,
          },
          xssProtection: { protection: true, modeBlock: true, override: true },
        },
      }
    )

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      certificate: certificate,
      defaultRootObject: 'index.html',
      domainNames: [domainName, fullDomainName],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/404.html',
          ttl: Duration.minutes(30),
        },
      ],
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(siteBucket, {
          originAccessIdentity: cloudfrontOAI,
        }),
        responseHeadersPolicy: responseHeadersPolicy,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: redirectLambda,
          },
        ],
      },
    })

    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      zone,
    })

    new route53.CnameRecord(this, 'SiteCnameRecord', {
      recordName: fullDomainName,
      domainName: domainName,
      zone,
    })

    new CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
    })
  }
}
