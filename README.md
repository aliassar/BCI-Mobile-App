# BCI Mobile App

A small React Native app (2023) that connects to a WebSocket stream of numeric samples, band-pass filters the signal on the device and animates a circle based on the result.

## What it does

- Type a WebSocket host or URL into the text field and press **Connect**. The input is validated with a regex; a bare host gets an `http://` prefix.
- Each incoming message is expected to be a string of comma-separated numbers (`"1.2, 3.4, ..."`). The app parses them, drops 6 values starting at index 4, and averages the rest (divided by 8) into a single "frontal average".
- The last 100 frontal averages are kept in memory. They are run through two first-order Butterworth band-pass filters from the `fili` library (sampling rate set to 128 Hz; centres 5.5 Hz and 10.5 Hz, named `alpha` and `theta` in the code). The ratio of the two outputs is computed per sample.
- The screen shows the raw values, the frontal average, the average of the ratio, the buffer length and a "delta" (latest ratio minus that average). A pink circle behind a fixed red one grows and shrinks with the delta.

The repo does not document what device or server is meant to feed the socket, so that part is left open.

Unfinished bits: TensorFlow.js (`@tensorflow/tfjs`, `tfjs-react-native`) is imported and listed in dependencies, but its initialisation is commented out, so the "TensorFlow.js ready?" line never turns on. Other dependencies (`expo-camera`, `coco-ssd`, `toxicity`, and others) are not used by `App.js`.

## Tech

React Native 0.69.5, React 18.0.0, Expo ^46 modules, `fili` ^2.0.3, `@tensorflow/tfjs` ^3.20.0. Everything lives in `App.js`.

## Run it

This targets React Native 0.69, so expect to need an older toolchain.

```sh
yarn install        # or npm install
yarn android        # react-native run-android
# iOS
cd ios && pod install && cd ..
yarn ios
```

The app only does something once it is pointed at a WebSocket server that sends data in the format above.
