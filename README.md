# External to Internal RTMP Feedback Pipeline

![architecture](https://github.com/shiraishimai/cdk-feedback/blob/main/doc/MWE.png?raw=true)

 * Our goal is to establish a RTMP pipeline from external to internal through channel
 * A RTMP input URL will be generated upon deployment of MediaLive Input
 * Channel requires the RTMP URL as its destination

## Problems

 * How to setup the Channel, such that its deployment is depending on Internal RTMP Input.
 * How to obtain Internal RTMP Input URL through AWS CDK.
