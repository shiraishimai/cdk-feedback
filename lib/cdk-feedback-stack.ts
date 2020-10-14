import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as medialive from '@aws-cdk/aws-medialive';
import {toUpperCamelCase} from './util';


export interface MediaLiveDemoProps  {
  /**
   * IAM role for the mediaLive.
   * 
   * @default - create a new role for this stack
   */
  readonly role?: iam.IRole;

  /**
   * input upstream trusted network CIDR
   * 
   * @default - 10.0.0.0/16
   */
  readonly trustedInputNetworkCidr?: string;

  /**
   * input security group
   * 
   * @default - automatically create a new security group with an ingress to allow all traffic from `trustedInputNetworkCidr`
   */
  readonly inputSecurityGroup?: ec2.ISecurityGroup[];
}

export class MediaLiveDemo extends cdk.Construct {
    readonly vpc: ec2.IVpc;
    private readonly trustedInputCidr: string;
    constructor(scope: cdk.Construct, id: string, props: MediaLiveDemoProps = {}) {
        super(scope, id);

        this.vpc = ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true });
        // create a new sg for this vpc and allow internally
        const vpcSecurityGroup = this.createVpcSecurityGroup();
        this.trustedInputCidr = props.trustedInputNetworkCidr ?? '10.0.0.0/16';
        let inputSecurityGroups = props.inputSecurityGroup ? props.inputSecurityGroup.map(s => s.securityGroupId) : 
            [ this.createInputSecurityGroup('external').securityGroupId ];
        const roleArn = props.role?.roleArn ?? this.createIamRole().roleArn;

        // Declare external input
        let inputName = "ExternalRTMP";
        let streamName = "app-external-stream";
        const externalRTMP = new medialive.CfnInput(this, inputName, {
            vpc: {
              securityGroupIds: [ vpcSecurityGroup.securityGroupId ],
              subnetIds: this.vpc.privateSubnets.map(s => s.subnetId),
            },
            name: inputName,
            type: "RTMP_PUSH",
            destinations: [{
                streamName
            }],
            roleArn,
            // inputSecurityGroups: ["7088515"]
            // inputSecurityGroups,
        });

        // Declare internal input
        inputName = "InternalRTMP";
        streamName = "app-internal-stream";
        const internalRTMP = new medialive.CfnInput(this, inputName, {
            vpc: {
              securityGroupIds: [ vpcSecurityGroup.securityGroupId ],
              subnetIds: this.vpc.privateSubnets.map(s => s.subnetId),
            },
            name: inputName,
            type: "RTMP_PUSH",
            destinations: [{
                streamName
            }],
            // inputSecurityGroups: ["7088515"]
            // inputSecurityGroups,
            roleArn,
        });

        // @TODO obtain internal RTMP URL from internalRTMP input
        // e.g. "rtmp://10.10.10.10:1935/app-internal-stream"
        const internalRTMPUrl: string[] = internalRTMP.attrSources

        // Declare channel that links external input to internal input
        // Declare properties that required by Channel
        const destinationRefId = "destination1";
        const destinations = [{
            "id": destinationRefId,
            "settings": internalRTMPUrl.map(url => ({
              url,
              streamName,
            })),
            "mediaPackageSettings": []
        }];
        const encoderSettings = toUpperCamelCase({
            audioDescriptions: [
                {
                    audioSelectorName: "Default",
                    codecSettings: {
                        aacSettings: {
                            inputType: "NORMAL",
                            bitrate: 192000,
                            codingMode: "CODING_MODE_2_0",
                            rawFormat: "NONE",
                            spec: "MPEG4",
                            profile: "LC",
                            rateControlMode: "CBR",
                            sampleRate: 48000,
                        },
                    },
                    audioTypeControl: "FOLLOW_INPUT",
                    languageCodeControl: "FOLLOW_INPUT",
                    name: "audio_1",
                },
            ],
            captionDescriptions: [],
            outputGroups: [
                {
                    outputGroupSettings: {
                        mediaPackageGroupSettings: {
                            destination: {
                                destinationRefId,
                            },
                        },
                    },
                    name: "external-internal-tunnel",
                    outputs: [
                        {
                            outputSettings: {
                                mediaPackageOutputSettings: {},
                            },
                            outputName: "1080p30",
                            videoDescriptionName: "video_1080p30",
                            audioDescriptionNames: ["audio_1"],
                            captionDescriptionNames: [],
                        },
                    ],
                },
            ],
            timecodeConfig: {
                source: "EMBEDDED",
            },
            videoDescriptions: [
                {
                    codecSettings: {
                        h264Settings: {
                            afdSignaling: "NONE",
                            colorMetadata: "INSERT",
                            adaptiveQuantization: "HIGH",
                            bitrate: 5000000,
                            entropyEncoding: "CABAC",
                            flickerAq: "ENABLED",
                            framerateControl: "SPECIFIED",
                            framerateNumerator: 30,
                            framerateDenominator: 1,
                            gopBReference: "ENABLED",
                            gopClosedCadence: 1,
                            gopNumBFrames: 3,
                            gopSize: 60,
                            gopSizeUnits: "FRAMES",
                            scanType: "PROGRESSIVE",
                            level: "H264_LEVEL_AUTO",
                            lookAheadRateControl: "HIGH",
                            numRefFrames: 3,
                            parControl: "SPECIFIED",
                            profile: "HIGH",
                            rateControlMode: "CBR",
                            syntax: "DEFAULT",
                            sceneChangeDetect: "ENABLED",
                            slices: 1,
                            spatialAq: "ENABLED",
                            temporalAq: "ENABLED",
                            timecodeInsertion: "DISABLED",
                        },
                    },
                    height: 1080,
                    name: "video_1080p30",
                    respondToAfd: "NONE",
                    sharpness: 50,
                    scalingBehavior: "DEFAULT",
                    width: 1920,
                },
            ],
        });
        const inputAttachments = [externalRTMP].map(input => {
            return {
                "inputId": input.ref,
                "inputAttachmentName": input.name,
                "inputSettings": {
                    "sourceEndBehavior": "CONTINUE",
                    "inputFilter": "AUTO",
                    "filterStrength": 1,
                    "deblockFilter": "DISABLED",
                    "denoiseFilter": "DISABLED",
                    "smpte2038DataPreference": "IGNORE",
                    "audioSelectors": [],
                    "captionSelectors": []
                }
            };
        });
        const inputSpecification = {
            "codec": "AVC",
            "resolution": "HD",
            "maximumBitrate": "MAX_10_MBPS"
        };
        const channel = new medialive.CfnChannel(this, 'FeedbackChannel', {
            destinations,
            encoderSettings,
            inputAttachments,
            inputSpecification,
            channelClass: "SINGLE_PIPELINE",
            name: "FeedbackChannel",
            // roleArn: "arn:aws:iam::471162862146:role/MediaLiveAccessRole"
            roleArn,
        });
    }
    private createIamRole(): iam.Role {
        // create a non-admin IAM role for medialive
        // see - https://docs.aws.amazon.com/medialive/latest/ug/setting-up-restricted-admin.html
        const role = new iam.Role(this, 'MediaLiveIamRole', {
          assumedBy: new iam.ServicePrincipal('medialive.amazonaws.com'),
          managedPolicies: [ 
            iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElementalMediaLiveFullAccess'),
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'),
          ],
        });
        // role.addToPolicy(new iam.PolicyStatement({
        //   actions: [ 'ec2:Describe*' ],
        //   resources: [ '*' ],
        // }))
        return role
    };
    private createInputSecurityGroup(id: string): ec2.SecurityGroup {
        // create an IAM role for medialive
        const sg = new ec2.SecurityGroup(this, `${id}DefaultInputSecurityGroup`, {
          vpc: this.vpc,
        })
        sg.addIngressRule(ec2.Peer.ipv4(this.trustedInputCidr), ec2.Port.allTraffic());
        return sg;
    };
    private createVpcSecurityGroup(): ec2.SecurityGroup {
        // create an IAM role for medialive
        const sg = new ec2.SecurityGroup(this, 'VpcSecurityGroup', {
          vpc: this.vpc,
        })
        sg.connections.allowInternally(ec2.Port.allTraffic());
        return sg;
    };
}
