# umi-plugin-animation-routes

An umi plugin for mobile h5 pages with native app-like Activity transitions. (for `umijs@3`)

[![NPM version](https://img.shields.io/npm/v/umi-plugin-animation-routes.svg?style=flat)](https://npmjs.org/package/umi-plugin-animation-routes)
[![NPM downloads](http://img.shields.io/npm/dm/umi-plugin-animation-routes.svg?style=flat)](https://npmjs.org/package/umi-plugin-animation-routes)

> Please understand that the following content is machine translated

[中文文档](./README.zh-CN.md)

## Features

### Routes Animation

<p><img src="./assets/animation-routes-1.gif" /></p>

The page will switch with animation without change anything. You can just using `history.push`/`history.goBack`/`<Link />` to switch route as usual.

Note: Animation is performed according to the `PUSH`/`POP` operation of the `history` listener. That is, if you jump from `/home` to `/about` and want to go back, use `history.goBack()` instead of `history.push('/home')` at all.

### Persist(keep-alive)

If you want to back to the previous page while still being able to keep all the states of the previous page (e.g. if you back to the product listing page, you naturally want to still be in the position you were looking at before), you can try `Persist` component.

I added a timer to each page and added `keep-alive` feature to `/about`, the effect of which can be seen below.

<p><img src="./assets/animation-routes-2.gif" /></p>

In the above gif, the routing hops are in the order of `/home` → `/about(persist)` → `/test1` → `/about(persist)` → `/test1` → `/test2/` → `/test1` → `/about(persist)`

Each time you enter the page, if it is the first time, the timer counts from 0. When you return to the `/about` page, you can see that the counter does not start at 0, the timer is still running (DOM are not uninstalled). The `/home` and `/test1` pages, which are not handled by `keep-alive`, are counted from 0 Start counting (DOM are unloaded when the route is switched)

#### How to use Persist

```jsx
import React from 'react';
/* add Persist to umi export */
import { Persist } from 'umi';
import styles from './AboutPage.less';

const AboutPage = () => (
  <div className={styles.root}>
    {/* place anywhere */}
    <Persist />
    <p className={styles.title}>This is About ...</p>
    ......
  </div>
);

export default AboutPage;
```

#### Hot to use history.block

Usually, we can use `history.block` or `Prompt`, which can use to block when the page jumps. As in the following example

```jsx
import { Modal } from 'antd-mobile';
import { history, Prompt } from 'umi';

/* Here is the way to block page jumping we always do. */
export default () => {
  useEffect(() => {
    /* By default, neither history.block nor Prompt supports await the Promise, but we can. */
    return history.block( (method, args) => new Promise((resolve) => {
      console.log(method, args);
      Modal.alert('Warn', 'Do you want to leave???', [{ text: 'Cancel' }, { text: 'Ok', onPress: resolve }]);
    }));
  }, []);
  return (
    <div>
      <Prompt message={(method, args) => new Promise(resolve => {
        console.log(method, args);
        Modal.alert('Warn', 'Do you want to leave???', [
          { text: 'Cancel' },
          { text: 'Ok', onPress: resolve },
        ]);
      })}>
    </div>
  );
}
```

However, due to the nature of `Persist`, the `unmount` event can not be triggered after the page is pushed into the stack. You won't be able to unblock in the `componentWillUnmount` or `useEffect` event.

Therefore, the route interception created in both ways in the above example will still take effect after the page leaves (presses into the stack).

To do this, I've added the `onShow`, `onHide` events to the `Persist` component for the Listening to the `keep-alive` page explicitly. The following is an implementation of route blocking with Persist.

```jsx
import { Modal } from 'antd-mobile';
import { history, Persist } from 'umi';

/* How to use route blocking in a keep-alive page */
export default () => {
  return (
    <div>
      {/* block history in onShow event */}
      <Persist
        onShow={() =>
          history.block(() => new Promise((resolve) => {
            Modal.alert('Warn', 'Do you want to leave???', [{ text: 'Cancel' }, { text: 'Ok', onPress: resolve }]);
          }))
        }
        onHide={() => console.log('hide')}
      />
    </div>
  );
}
```

## Why

In PC pages, the animations themselves are not particularly rich, especially for page transitions, and there is little need for them.

But it's different on mobile, where all actions should have visual feedback, especially for page toggles. In Native App, transition animations are added by default for each active page switch. And if we want to use html to develop Hybrid App, then implementing some basic animation effects is Indispensable. This plug-in is for the use of `umijs@3` partners to achieve the routing animation created.

## Notice

- The plug-in overrides the default `clientRender` logic of `umijs`, which may conflict with other plug-ins that use `clientRender`.
- Plugin intercepts the `history` used by `umijs`, which may affect other operations that intercept `history`.
  - Replaced the logic of `history.block`, and added a `callback` `callback` logic to the `umijs` plugin. async function` support, compatible with the old way of using `history.
  - Use `history.originBlock` instead of the `history. block` API with `history.originBlock`.
  - If a callback function is used as an argument to `history.block`, the callback function will not get the ` location` information. Instead, the method and parameters that trigger the route jump will be used as parameters for the callback function.
  - For `replace`/`push`/`go`/`goBack`/` The goForward` method intercepts and supports the new `history.block` logic.

### history.originBlock

There are 2 reasons why I override the original logic of `history.block`.

1. I would like to add support for asynchronous interception.
2. the `history` tool can't tell me exactly what the user clicked on when they clicked forward/backward.

On the second point, the browser doesn't tell you whether the user went forward or backward, [see issue](https://github.com/ReactTraining/history/issues/676). While the authors say that it is possible to mark the serial number of a route by customizing the property in the state, mobile projects typically use the hash route and not support for setting state (at least in the `umi@3` integrated `history-with-query' `). And `history` source code has a record of idx, but I can't get it.

## Install

```bash
# npm or yarn
$ npm install umi-plugin-animation-routes -D
```

## Usage

`umijs@3` will scan for plugins that match the naming convention and automatically register them.

## Options

Configure in `.umirc.js`,

```js
export default {
  animationRoutes: {
    kHistory: false,
  },
};
```

### kHistory

> since: 0.3.0

Add support to `k-history`, which fix `history.block` broken after reload.

Tips: Add [`k-history`](https://www.npmjs.com/package/k-history) to dependencies before using option `kHistory`.

## LICENSE

MIT
