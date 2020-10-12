import * as cdk from '@aws-cdk/core';
import * as medialive from '@aws-cdk/aws-medialive';
import {toUpperCamelCase} from './util';

export class CdkFeedbackStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Declare external input
        let inputName = "ExternalRTMP";
        let streamName = "app-external-stream";
        const externalRTMP = new medialive.CfnInput(this, inputName, {
            name: inputName,
            type: "RTMP_PUSH",
            destinations: [{
                streamName
            }],
            inputSecurityGroups: ["7088515"]
        });

        // Declare internal input
        inputName = "InternalRTMP";
        streamName = "app-internal-stream";
        const internalRTMP = new medialive.CfnInput(this, inputName, {
            name: inputName,
            type: "RTMP_PUSH",
            destinations: [{
                streamName
            }],
            inputSecurityGroups: ["7088515"]
        });

        // @TODO obtain internal RTMP URL from internalRTMP input
        // e.g. "rtmp://10.10.10.10:1935/app-internal-stream"
        const internalRTMPUrl = "";

        // Declare channel that links external input to internal input
        // Declare properties that required by Channel
        const destinationRefId = "destination1";
        const destinations = [{
            "id": destinationRefId,
            "settings": [{
                "url": internalRTMPUrl, // @TODO obtain internal RTMP URL from internalRTMP input
                streamName
            }],
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
            roleArn: "arn:aws:iam::471162862146:role/MediaLiveAccessRole"
        });
    }
}
