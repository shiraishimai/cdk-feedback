import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as medialive from '@aws-cdk/aws-medialive';
import {toUpperCamelCase} from './util';
import { CfnInputSecurityGroup } from '@aws-cdk/aws-medialive';


enum InputType {
  RTMP_PUSH = 'RTMP_PUSH',
  RTMP_PULL = 'RTMP_PULL',
}

export interface Destination {
  readonly streamName: string;
}

export interface InputVpcRequest {
  readonly securityGroup?: ec2.ISecurityGroup[];
  readonly subnet?: ec2.ISubnet[];
}

/**
 * Construct properties for the Input resource
 */
export interface InputProps extends cdk.ResourceProps {
  /**
   * name of the Input
   */
  readonly name?: string
  /**
   * type of the Input
   * 
   * @default RTMP_PUSH
   */
  readonly type?: InputType;
  /**
   * IAM Role for the MediaLive Input
   */
  readonly role?: iam.IRole;
  /**
   * Input SecurityGruops
   */
  readonly inputSecurityGroups?: CfnInputSecurityGroup[];
  /**
   * destinations
   */
  readonly destination: Destination[]; 
  /**
   * VPC Input request
   */
  readonly vpcInput?: InputVpcRequest;
}

export class Input extends cdk.Resource {
  readonly destination: string;
  readonly id: string;
  readonly name: string;
  constructor(scope: cdk.Construct, id: string, props: InputProps) {
    super(scope, id)
        this.name = props.name ?? id;
        const resource = new medialive.CfnInput(this, 'Resource', {
            vpc: props.vpcInput ? {
              securityGroupIds: props.vpcInput.securityGroup?.map(s => s.securityGroupId),
              subnetIds: props.vpcInput.subnet?.map(s => s.subnetId),
            } : undefined,
            name: this.name,
            type: props.type ?? InputType.RTMP_PUSH,
            destinations: props.destination
              ? props.destination.map(d => ({ streamName: d.streamName }))
              : undefined,
            roleArn: props.role ? props.role.roleArn : undefined,
            inputSecurityGroups: props.inputSecurityGroups ? props.inputSecurityGroups.map(s => s.ref) : undefined,
        });
        this.destination = cdk.Fn.select(0, resource.attrDestinations);
        this.id = resource.ref;
        // new cdk.CfnOutput(this, 'Destination', { value:  cdk.Fn.join(',', resource.attrDestinations)  })
  }
}

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
   * input security group for internalRTMP
   * 
   * @default - automatically create a new security group with an ingress to allow all traffic from `trustedInputNetworkCidr`
   */
  readonly internalInputSecurityGroup?: medialive.CfnInputSecurityGroup[];

  /**
   * input security group for externalRTMP
   * 
   * @default - automatically create a new security group with an ingress to allow all traffic from `0.0.0.0/0`
   */
  readonly externalInputSecurityGroup?: medialive.CfnInputSecurityGroup[];

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
        // const externalInputSecurityGroups = props.externalInputSecurityGroup ? props.externalInputSecurityGroup.map(s => s.ref) : 
        //     [ this.createExternalInputSecurityGroup().ref ];
        // const internalInputSecurityGroups = props.internalInputSecurityGroup ? props.internalInputSecurityGroup.map(s => s.ref) : 
        //     [ this.createInternalInputSecurityGroup().ref ];

        // const roleArn = props.role?.roleArn ?? this.createIamRole().roleArn;
        const role = props.role ?? this.createIamRole();

        // Declare external input
        const externalInputName = "ExternalRTMP";
        const externalStreamName = "app-external-stream";

        const externalRTMP = new Input(this, 'ExternalRTMP', {
          name: externalInputName,
          type: InputType.RTMP_PUSH,
          destination: [
            {
              streamName: externalStreamName,
            }
          ],
          role,
          inputSecurityGroups: props.externalInputSecurityGroup ?? [ this.createExternalInputSecurityGroup() ],
        })

        // const externalRTMP = new medialive.CfnInput(this, externalInputName, {
        //     // vpc: {
        //     //   securityGroupIds: [ vpcSecurityGroup.securityGroupId ],
        //     //   subnetIds: this.vpc.privateSubnets.map(s => s.subnetId),
        //     // },
        //     name: externalInputName,
        //     type: "RTMP_PUSH",
        //     destinations: [{
        //         streamName: externalStreamName
        //     }],
        //     roleArn,
        //     // inputSecurityGroups: ["7088515"]
        //     inputSecurityGroups: externalInputSecurityGroups,
        // });

        
        // Declare internal input
        const internalInputName = "InternalRTMP";
        const internalStreamName = "app-internal-stream";

        const internalRTMP = new Input(this, 'InternalRTMP', {
          name: internalStreamName,
          type: InputType.RTMP_PUSH,
          destination: [{
            streamName: internalStreamName,
          }],
          role,
          inputSecurityGroups: props.internalInputSecurityGroup ?? [ this.createInternalInputSecurityGroup() ],
        })
        
        // const internalRTMP = new medialive.CfnInput(this, internalInputName, {
        //     // vpc: {
        //     //   securityGroupIds: [ vpcSecurityGroup.securityGroupId ],
        //     //   subnetIds: this.vpc.privateSubnets.map(s => s.subnetId),
        //     // },
        //     name: internalStreamName,
        //     type: "RTMP_PUSH",
        //     destinations: [{
        //         streamName: internalStreamName,
        //     }],
        //     // inputSecurityGroups: ["7088515"]
        //     inputSecurityGroups: internalInputSecurityGroups,
        //     roleArn,
        // });

        // new cdk.CfnOutput(this, 'Destinations', { value: cdk.Fn.join(',', internalRTMP.attrDestinations) });
        new cdk.CfnOutput(this, 'InternalDestinations', { value: internalRTMP.destination });
        new cdk.CfnOutput(this, 'ExternalDestinations', { value: externalRTMP.destination });

        // @TODO obtain internal RTMP URL from internalRTMP input
        // e.g. "rtmp://10.10.10.10:1935/app-internal-stream"
        // const internalRTMPUrl: string[] = internalRTMP.attrSources

        // Declare channel that links external input to internal input
        // Declare properties that required by Channel
        const destinationRefId = "destination1";
        const destinations = [{
            "id": destinationRefId,
            "settings": [
              {
                streamName: internalStreamName,
                url: internalRTMP.destination,
              }
            ],
            // "settings": internalRTMPUrl.map(url => ({
            //   url,
            //   streamName: internalStreamName,
            // })),
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
                "inputId": input.id,
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
            roleArn: role.roleArn,
        });

        // channel.node.addDependency(internalRTMP, externalRTMP)
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
    private createExternalInputSecurityGroup(): medialive.CfnInputSecurityGroup {
        return new medialive.CfnInputSecurityGroup(this, 'ExternalInputSecurityGroup', {
          whitelistRules: [
            { cidr: '0.0.0.0/0'}
          ]
        })
    };
    private createInternalInputSecurityGroup(): medialive.CfnInputSecurityGroup {
        return new medialive.CfnInputSecurityGroup(this, 'InternalInputSecurityGroup', {
          whitelistRules: [
            { cidr: this.trustedInputCidr }
          ]
        })
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
