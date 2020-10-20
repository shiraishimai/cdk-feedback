import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as medialiveDemo from '../lib/cdk-feedback-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new cdk.Stack(app, 'MyTestStack');
    new medialiveDemo.MediaLiveDemo(stack, 'MediaLiveDemo')
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
