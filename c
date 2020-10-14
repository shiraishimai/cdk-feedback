Resources:
  MediaLiveDemoVpcSecurityGroupF99B6325:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: MediaLiveDemoStack/MediaLiveDemo/VpcSecurityGroup
      SecurityGroupEgress:
        - CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic by default
          IpProtocol: "-1"
      VpcId: vpc-497a492d
    Metadata:
      aws:cdk:path: MediaLiveDemoStack/MediaLiveDemo/VpcSecurityGroup/Resource
  MediaLiveDemoVpcSecurityGroupfromMediaLiveDemoStackMediaLiveDemoVpcSecurityGroup3C8CDFA5ALLTRAFFIC7A3C7439:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      IpProtocol: "-1"
      Description: from MediaLiveDemoStackMediaLiveDemoVpcSecurityGroup3C8CDFA5:ALL TRAFFIC
      GroupId:
        Fn::GetAtt:
          - MediaLiveDemoVpcSecurityGroupF99B6325
          - GroupId
      SourceSecurityGroupId:
        Fn::GetAtt:
          - MediaLiveDemoVpcSecurityGroupF99B6325
          - GroupId
    Metadata:
      aws:cdk:path: MediaLiveDemoStack/MediaLiveDemo/VpcSecurityGroup/from MediaLiveDemoStackMediaLiveDemoVpcSecurityGroup3C8CDFA5:ALL TRAFFIC
  MediaLiveDemoMediaLiveIamRole28DBF1A9:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Action: sts:AssumeRole
            Effect: Allow
            Principal:
              Service: medialive.amazonaws.com
        Version: "2012-10-17"
      ManagedPolicyArns:
        - Fn::Join:
            - ""
            - - "arn:"
              - Ref: AWS::Partition
              - :iam::aws:policy/AWSElementalMediaLiveFullAccess
        - Fn::Join:
            - ""
            - - "arn:"
              - Ref: AWS::Partition
              - :iam::aws:policy/AmazonEC2ReadOnlyAccess
    Metadata:
      aws:cdk:path: MediaLiveDemoStack/MediaLiveDemo/MediaLiveIamRole/Resource
  MediaLiveDemoExternalInputSecurityGroup7FB4324B:
    Type: AWS::MediaLive::InputSecurityGroup
    Properties:
      WhitelistRules:
        - Cidr: 0.0.0.0/0
    Metadata:
      aws:cdk:path: MediaLiveDemoStack/MediaLiveDemo/ExternalInputSecurityGroup
  MediaLiveDemoExternalRTMPC670DC41:
    Type: AWS::MediaLive::Input
    Properties:
      Destinations:
        - StreamName: app-external-stream
      InputSecurityGroups:
        - Ref: MediaLiveDemoExternalInputSecurityGroup7FB4324B
      Name: ExternalRTMP
      RoleArn:
        Fn::GetAtt:
          - MediaLiveDemoMediaLiveIamRole28DBF1A9
          - Arn
      Type: RTMP_PUSH
    Metadata:
      aws:cdk:path: MediaLiveDemoStack/MediaLiveDemo/ExternalRTMP/Resource
  MediaLiveDemoInternalInputSecurityGroup87614E16:
    Type: AWS::MediaLive::InputSecurityGroup
    Properties:
      WhitelistRules:
        - Cidr: 10.0.0.0/16
    Metadata:
      aws:cdk:path: MediaLiveDemoStack/MediaLiveDemo/InternalInputSecurityGroup
  MediaLiveDemoInternalRTMP13E5CD36:
    Type: AWS::MediaLive::Input
    Properties:
      Destinations:
        - StreamName: app-internal-stream
      InputSecurityGroups:
        - Ref: MediaLiveDemoInternalInputSecurityGroup87614E16
      Name: app-internal-stream
      RoleArn:
        Fn::GetAtt:
          - MediaLiveDemoMediaLiveIamRole28DBF1A9
          - Arn
      Type: RTMP_PUSH
    Metadata:
      aws:cdk:path: MediaLiveDemoStack/MediaLiveDemo/InternalRTMP/Resource
  MediaLiveDemoFeedbackChannel522D2A24:
    Type: AWS::MediaLive::Channel
    Properties:
      ChannelClass: SINGLE_PIPELINE
      Destinations:
        - Id: destination1
          MediaPackageSettings: []
          Settings:
            - StreamName: app-internal-stream
              Url:
                Fn::Select:
                  - 0
                  - Fn::GetAtt:
                      - MediaLiveDemoInternalRTMP13E5CD36
                      - Destinations
      EncoderSettings: {}
      InputAttachments:
        - InputAttachmentName: ExternalRTMP
          InputId:
            Ref: MediaLiveDemoExternalRTMPC670DC41
          InputSettings:
            AudioSelectors: []
            CaptionSelectors: []
            DeblockFilter: DISABLED
            DenoiseFilter: DISABLED
            FilterStrength: 1
            InputFilter: AUTO
            Smpte2038DataPreference: IGNORE
            SourceEndBehavior: CONTINUE
      InputSpecification:
        Codec: AVC
        MaximumBitrate: MAX_10_MBPS
        Resolution: HD
      Name: FeedbackChannel
      RoleArn:
        Fn::GetAtt:
          - MediaLiveDemoMediaLiveIamRole28DBF1A9
          - Arn
    Metadata:
      aws:cdk:path: MediaLiveDemoStack/MediaLiveDemo/FeedbackChannel
  CDKMetadata:
    Type: AWS::CDK::Metadata
    Properties:
      Modules: aws-cdk=1.67.0,@aws-cdk/assets=1.67.0,@aws-cdk/aws-cloudwatch=1.67.0,@aws-cdk/aws-ec2=1.67.0,@aws-cdk/aws-events=1.67.0,@aws-cdk/aws-iam=1.67.0,@aws-cdk/aws-kms=1.67.0,@aws-cdk/aws-logs=1.67.0,@aws-cdk/aws-medialive=1.67.0,@aws-cdk/aws-s3=1.67.0,@aws-cdk/aws-s3-assets=1.67.0,@aws-cdk/aws-ssm=1.67.0,@aws-cdk/cloud-assembly-schema=1.67.0,@aws-cdk/core=1.67.0,@aws-cdk/cx-api=1.67.0,@aws-cdk/region-info=1.67.0,jsii-runtime=node.js/v12.19.0
    Metadata:
      aws:cdk:path: MediaLiveDemoStack/CDKMetadata/Default
Outputs:
  MediaLiveDemoInternalDestinations0A469205:
    Value:
      Fn::Select:
        - 0
        - Fn::GetAtt:
            - MediaLiveDemoInternalRTMP13E5CD36
            - Destinations
  MediaLiveDemoExternalDestinations687A47EA:
    Value:
      Fn::Select:
        - 0
        - Fn::GetAtt:
            - MediaLiveDemoExternalRTMPC670DC41
            - Destinations

